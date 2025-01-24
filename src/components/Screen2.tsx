import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Screen2 = () => {
  const containerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const numberRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bottomBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Animation pour chaque numéro
    numberRefs.current.forEach((number, index) => {
      gsap.fromTo(number,
        {
          yPercent: -100,
          opacity: 0
        },
        {
          yPercent: 0,
          opacity: 1,
          duration: 1.6,
          ease: "slow(0.7, 0.7, false)",
          scrollTrigger: {
            trigger: containerRefs.current[index],
            start: "top center",
            end: "top center",
            toggleActions: "play none none reverse",
            // markers: true, // Pour le debug
          }
        }
      );
    });

    // Animation de la barre du bas
    gsap.fromTo(bottomBarRef.current,
      {
        yPercent: 100,
        opacity: 0
      },
      {
        yPercent: 0,
        opacity: 1,
        duration: 1.6,
        ease: "slow(0.7, 0.7, false)",
        scrollTrigger: {
          trigger: containerRefs.current[0],
          start: "top bottom",
          end: "top center",
          toggleActions: "play none none reverse",
        }
      }
    );

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div className="min-h-screen bg-[rgb(16,16,16)] text-white p-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="text-xl">B one consulting</div>
        <button className="px-6 py-2 border border-blue-600 text-blue-600 rounded-full">
          SAY HELLO
        </button>
      </div>

      {/* Main Title */}
      <h1 className="text-5xl mt-20 mb-24 bg-gradient-to-b from-gray-400 to-white bg-clip-text text-transparent">
        360° SERVICES
      </h1>

      {/* Services Grid */}
      <div className="grid grid-cols-4 gap-0 w-2/3 mx-auto">
        {/* Service 1 */}
        <div 
          className="service-item border-l border-gray-600 pl-6 pr-4"
          ref={(el) => { containerRefs.current[0] = el }}
        >
          <div 
            className="gradient-text-mask text-[12rem] mb-8"
            ref={(el) => { numberRefs.current[0] = el }}
          >
            01
          </div>
          <div className="gradient-text-mask text-3xl">
            AUDIT & <br />
            IT CONSULTING
          </div>
        </div>

        {/* Service 2 */}
        <div 
          className="service-item border-l border-gray-600 pl-6 pr-4"
          ref={(el) => { containerRefs.current[1] = el }}
        >
          <div 
            className="gradient-text-mask text-[12rem] mb-8"
            ref={(el) => { numberRefs.current[1] = el }}
          >
            02
          </div>
          <div className="gradient-text-mask text-3xl">
            DIGITAL <br />
            SOLUTION
          </div>
        </div>

        {/* Service 3 */}
        <div 
          className="service-item border-l border-gray-600 pl-6 pr-4"
          ref={(el) => { containerRefs.current[2] = el }}
        >
          <div 
            className="gradient-text-mask text-[12rem] mb-8"
            ref={(el) => { numberRefs.current[2] = el }}
          >
            03
          </div>
          <div className="gradient-text-mask text-3xl">
            DATA <br />
            SOLUTION
          </div>
        </div>

        {/* Service 4 */}
        <div 
          className="service-item border-l border-gray-600 pl-6 pr-4"
          ref={(el) => { containerRefs.current[3] = el }}
        >
          <div 
            className="gradient-text-mask text-[12rem] mb-8"
            ref={(el) => { numberRefs.current[3] = el }}
          >
            04
          </div>
          <div className="gradient-text-mask text-3xl">
            MARKETING <br />
            & BRANDING
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="pr-8 w-2/3 mx-auto">
      <div ref={bottomBarRef} className=" mt-20 flex justify-between items-center border border-gray-800 rounded-full px-8 py-4">
        
        <div className="text-xl">OUR SERVICES</div>
        <div className="text-xl">OPEN</div>
        
      </div>
      </div>
    </div>
  );
};

export default Screen2;
