"use client";

import PageWrapper from "@/components/private/page-wrapper";
import Cal from "@calcom/embed-react";
import { motion } from 'motion/react'

const DemoView = () => {
  return (
    <>
      <Hero />  
      <PageWrapper>
        <motion.div 
          className="max-w-7xl w-full mx-auto space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Cal
            calLink="smartables/demo-gratuita"
            style={{ width: "100%", height: "100%", overflow: "scroll", colorScheme: "light" }}
            config={{ layout: "month_view", locale: "it" }}
          />
        </motion.div>
      </PageWrapper>
    </>
  );
}


const Hero = () => {
  return (
    <section className="bg-[#ff9f29] w-full py-20 md:py-32 relative overflow-hidden">

      <div className="container px-4 md:px-6 mx-auto relative z-10 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Prenota una demo
          </h1>
          <p className="text-xl text-white mb-8 max-w-2xl mx-auto">
            Scopri come Smartables può trasformare la gestione del tuo ristorante.
            Scegli un orario e parliamoci.          
          </p>
        </motion.div>
      </div>
    </section>
  )
}

export default DemoView