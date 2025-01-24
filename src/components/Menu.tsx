import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

// Variable globale pour tracker l'animation en cours
let isAnimating = false;

const MenuItem = ({ text }: { text: string }) => {
  const lineRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  

  return (
    <div className="flex items-center cursor-pointer">
      <div 
        ref={textRef}
        data-text
        className="hover:font-white text-[rgb(240,240,240)] text-md opacity-0 -translate-x-[10px] w-[200px] text-right pr-4"
      >
        {text}
      </div>
      <div 
        ref={lineRef}
        className="h-[1px] bg-white w-[48px]"
      />
    </div>
  );
};

const Menu = () => {
  const menuItems = [
    'Introduction',
    'Services',
    'About Us',
    'Clients & Partners',
    'Contact'
  ];

  const menuContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = menuContainerRef.current;
    const items = Array.from(container?.children || []);

    const handleMouseEnter = () => {
      if (isAnimating) return;
      isAnimating = true;

      const textElements = Array.from(container?.querySelectorAll('[data-text]') || []);
      
      gsap.to(items, {
        marginBottom: 15,
        duration: 0.3,
        stagger: 0.05,
        ease: "power2.out"
      });

      gsap.to(textElements, {
        opacity: 1,
        x: 0,
        duration: 0.3,
        stagger: 0.05,
        ease: "power2.out"
      });
    };

    const handleMouseLeave = () => {
      const textElements = Array.from(container?.querySelectorAll('[data-text]') || []);
      
      gsap.to(items, {
        marginBottom: 1,
        duration: 0.3,
        ease: "power2.out"
      });

      gsap.to(textElements, {
        opacity: 0,
        x: -10,
        duration: 0.3,
        ease: "power2.out",
        onComplete: () => {
          isAnimating = false;
        }
      });
    };

    container?.addEventListener('mouseenter', handleMouseEnter);
    container?.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container?.removeEventListener('mouseenter', handleMouseEnter);
      container?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div ref={menuContainerRef} className="fixed top-20 right-20 flex flex-col gap-1 pl-1 bg-transparent">
      {menuItems.map((item, index) => (
        <MenuItem key={index} text={item} />
      ))}
    </div>
  );
};

export default Menu; 