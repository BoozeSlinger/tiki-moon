'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ---------------------------------------------------------------------------
// Vanishing point = centre of the doorway arch (50% across, 63% down).
// Every layer shares this exact transform-origin so the whole scene zooms
// outward from that single point — true perspective dolly-in effect.
// ---------------------------------------------------------------------------
const VP = '50% 63%';

const LAYERS = [
  // id must match the img ref keys used below
  // scaleTo: how large the layer grows by the time you reach the door.
  // Far layers grow barely; near layers rush past you.
{ id: 'stars',       src: '/images/tiki-parallax/stars-nebula.png',              alt: 'Starry nebula backdrop',                   zIndex: 1,  eager: true,  scaleTo: 1.08 },
{ id: 'planets',     src: '/images/tiki-parallax/planets-moons-galaxy.png',      alt: 'Distant planets, moons and galaxy',        zIndex: 2,  eager: true,  scaleTo: 1.12 },
{ id: 'mountains',   src: '/images/tiki-parallax/moon-mountains.png',            alt: 'Lunar mountains on the horizon',           zIndex: 3,  eager: true,  scaleTo: 1.18 },
{ id: 'building',    src: '/images/tiki-parallax/tiki-bar-building.png',         alt: 'Supernatural neon tiki bar building',      zIndex: 5,  eager: true,  scaleTo: 3.20 },
{ id: 'signage',     src: '/images/tiki-parallax/neon-signage-lanterns.png',     alt: 'Neon tiki signage and lanterns',           zIndex: 6,  eager: true,  scaleTo: 3.30 },
{ id: 'entrance',    src: '/images/tiki-parallax/entrance-decor.png',            alt: 'Entrance decor and side props',            zIndex: 7,  eager: false, scaleTo: 3.80 },
{ id: 'path',        src: '/images/tiki-parallax/path-ground.png',               alt: 'Path and ground leading to the entrance',  zIndex: 8,  eager: false, scaleTo: 5.00 },
{ id: 'foreground',  src: '/images/tiki-parallax/foreground-totems-torches-sign.png', alt: 'Foreground tiki totems, torches and sign', zIndex: 9,  eager: false, scaleTo: 7.00 },
{ id: 'foliage',     src: '/images/tiki-parallax/corner-foliage.png',            alt: 'Corner tropical foliage framing',          zIndex: 10, eager: false, scaleTo: 9.00 },
  ] as const;

type LayerId = typeof LAYERS[number]['id'];

export default function TikiApproachScene() {
    const sectionRef = useRef<HTMLElement>(null);
  const imgRefs    = useRef<Partial<Record<LayerId, HTMLImageElement>>>({});
  const overlayRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Reveal the scene (hidden until GSAP is ready to avoid flash)
    gsap.set('.gsap-reveal', { visibility: 'visible', opacity: 1 });

    // Respect reduced-motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      LAYERS.forEach(({ id, scaleTo }) => {
        const el = imgRefs.current[id];
        if (el) gsap.set(el, { transformOrigin: VP, scale: scaleTo * 0.5 });
});
      return;
}

    // ---------- responsive scale multiplier ----------
    const mm = gsap.matchMedia();

    function buildTimeline(scaleMultiplier: number) {
            const tl = gsap.timeline({
        scrollTrigger: {
          trigger:           sectionRef.current,
                      start:             'top top',
                      end:               'bottom bottom',
                      scrub:             1.2,
                      invalidateOnRefresh: true,
            },
            });

      // Each layer: scale from 1 → scaleTo (× multiplier), all from the VP
      LAYERS.forEach(({ id, scaleTo }) => {
                const el = imgRefs.current[id];
                if (!el) return;
        gsap.set(el, { transformOrigin: VP, scale: 1 });
        tl.fromTo(
                    el,
          { scale: 1 },
          { scale: scaleTo * scaleMultiplier, ease: 'power3.in', force3D: true },
                    0,
                  );
            });

      // Fade to black in the last 20 % of the scroll — stepping inside
      if (overlayRef.current) {
        tl.fromTo(
                    overlayRef.current,
          { opacity: 0 },
          { opacity: 1, ease: 'none' },
                    0.80,  // starts at 80 % of the timeline
                  );
      }
    }

    mm.add('(min-width: 1024px)',               () => buildTimeline(1.0));
    mm.add('(min-width: 768px) and (max-width: 1023px)', () => buildTimeline(0.9));
    mm.add('(max-width: 767px)',                () => buildTimeline(0.75));

    return () => mm.revert();

}, { scope: sectionRef });

  const imgStyle = (zIndex: number): React.CSSProperties => ({
        position:         'absolute',
              inset:            0,
              width:            '100%',
              height:           '100%',
              objectFit:        'cover',
              objectPosition:   'center center',
              pointerEvents:    'none',
              willChange:       'transform',
              backfaceVisibility: 'hidden',
              zIndex,
          });

  return (
        <section
          ref={sectionRef}
          id="tiki-approach-container"
          className="relative w-full h-[400vh] bg-black select-none"
        >
          <div className="sticky top-0 left-0 w-full h-screen overflow-hidden bg-black">
            <div
              className="gsap-reveal absolute inset-0 w-full h-full"
              style={{ visibility: 'hidden', opacity: 0 }}
        >
{LAYERS.map(({ id, src, alt, zIndex, eager }) => (
              <img
                key={id}
                ref={el => { if (el) imgRefs.current[id] = el; }}
                src={src}
                                alt={alt}
                                loading={eager ? 'eager' : 'lazy'}
                                style={imgStyle(zIndex)}
                              />
                            ))}

                  {/* Fade-to-black overlay — driven by the GSAP timeline above */}
          <div
            ref={overlayRef}
            style={{
              position:      'absolute',
              inset:         0,
              background:    'black',
              opacity:       0,
              pointerEvents: 'none',
              zIndex:        50,
}}
          />
        </div>
      </div>
    </section>
                    );
       }
