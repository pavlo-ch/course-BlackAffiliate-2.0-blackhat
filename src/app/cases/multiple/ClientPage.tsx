'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Play, TrendingDown, CheckCircle, Users, ArrowRight } from 'lucide-react';


export default function MultipleCaseStudy() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900 pt-20 pb-20 font-sans">
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 max-w-5xl">
        <Link href="/" className="inline-flex items-center text-gray-500 hover:text-orange-600 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-center leading-tight">
          Optimization Meta Setup <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
            for The Multiple
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-600 text-center max-w-3xl mx-auto mb-12 leading-relaxed">
          How we helped an in-house media buying team reduce CPA from <span className="text-red-500 font-bold line-through decoration-red-300">$600+</span> to <span className="text-green-600 font-bold">~$250</span> per FTD.
        </p>

        {/* Partner Link */}
        <div className="flex justify-center mb-16">
            <a 
              href="#" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-orange-600 text-white font-bold text-lg rounded-full hover:bg-orange-700 transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-orange-500/30"
            >
              <span>Visit The Multiple</span>
              <ExternalLink className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </a>
        </div>

        {/* Video Placeholder */}
        <div className="mb-20 rounded-2xl overflow-hidden bg-gray-100 aspect-video flex items-center justify-center border-2 border-gray-200 shadow-2xl relative group cursor-pointer" onClick={() => setIsVideoPlaying(true)}>
           {!isVideoPlaying ? (
             <>
               <div className="absolute inset-0 bg-gradient-to-tr from-gray-900/10 to-transparent"></div>
               <div className="z-10 text-center p-8 transform group-hover:scale-105 transition-transform duration-300">
                 <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl text-orange-600 group-hover:text-orange-700">
                   <Play className="w-10 h-10 ml-1 fill-current" />
                 </div>
                 <h3 className="text-2xl font-bold text-gray-900 mb-2">Watch the Case Study</h3>
                 <p className="text-gray-500 font-medium">Video coming soon</p>
               </div>
             </>
           ) : (
             <div className="flex items-center justify-center w-full h-full bg-black text-white">
                <p>Video Placeholder</p>
             </div>
           )}
        </div>

        {/* Introduction */}
        <div className="max-w-4xl mx-auto mb-20 text-lg text-gray-700 leading-relaxed text-center">
          <p>
            <strong className="text-gray-900">The Multiple</strong> is an in‑house media buying team for a large European casino group. 
            They work with long-term direct-deal partners and are responsible for a stable stream of FTDs from Meta ads.
          </p>
        </div>

        {/* Problem Section */}
        <section className="mb-20">
          <div className="bg-gray-50 rounded-3xl p-8 md:p-12 border border-gray-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
            
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-4 text-gray-900 relative z-10">
              <div className="p-3 bg-red-100 rounded-xl text-red-600">
                <TrendingDown className="w-8 h-8" />
              </div>
              The Challenge: High CPA & Instability
            </h2>

            <div className="grid md:grid-cols-2 gap-12 relative z-10">
              <div>
                <p className="text-gray-700 mb-6 text-lg">
                  They approached us with a clear problem:
                </p>
                <blockquote className="border-l-4 border-red-500 pl-6 py-2 mb-8 italic text-xl text-gray-800 bg-white/50 rounded-r-lg">
                  “Right now we are live with iGaming Meta but using Web2Web, results aren’t consistent and we are getting high CPAs.”
                </blockquote>
                <div className="p-6 bg-white rounded-xl border border-red-100 shadow-sm">
                   <p className="text-red-600 font-semibold mb-2 uppercase tracking-wide text-sm">The Pain Point</p>
                   <p className="text-3xl font-bold text-gray-900">
                     CPA in Germany was <span className="text-red-500">$600+</span>
                   </p>
                   <p className="text-gray-500 mt-2">Making scaling economically impossible.</p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-6 text-lg border-b border-gray-100 pb-4">What we found in their stack:</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">1</span>
                    <span className="text-gray-700"><strong className="text-gray-900">Geos:</strong> Germany, Denmark, Canada, Ireland, Norway.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">2</span>
                    <span className="text-gray-700"><strong className="text-gray-900">Events:</strong> Leads goal and purchase goal running in parallel.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">3</span>
                    <span className="text-gray-700"><strong className="text-gray-900">Audiences:</strong> Retargeting visitors, LAL on depositors, Advantage+ tests.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">4</span>
                    <span className="text-gray-700"><strong className="text-gray-900">Funnel:</strong> Pure Web2Web without PWA/APP solutions.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="mb-24">
           <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-gray-900">
             Our <span className="text-orange-600">Strategic Approach</span>
           </h2>

           <div className="grid md:grid-cols-2 gap-8">
              {/* Step 1 */}
              <div className="group bg-white p-8 rounded-2xl border-2 border-gray-100 hover:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6 text-xl font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">1</div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">Deep System Audit</h3>
                  <p className="text-gray-600 mb-6">
                    Instead of generic "quick tips", we conducted a forensic audit of their entire setup.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-sm text-gray-700">
                      <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      Deconstructed campaign structure & tracking logic.
                    </li>
                    <li className="flex items-start gap-3 text-sm text-gray-700">
                      <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      Identified bottlenecks in event optimization.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Step 2 */}
              <div className="group bg-white p-8 rounded-2xl border-2 border-gray-100 hover:border-green-500 transition-all duration-300 shadow-sm hover:shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6 text-xl font-bold group-hover:bg-green-600 group-hover:text-white transition-colors">2</div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">CIS Methodologies</h3>
                  <p className="text-gray-600 mb-6">
                    We deployed aggressive strategies honed in the CIS market, adapted for Western compliance.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-sm text-gray-700">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      Shifted optimization to LTV-focused events.
                    </li>
                    <li className="flex items-start gap-3 text-sm text-gray-700">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      Implemented hybrid funnels beyond pure Web2Web.
                    </li>
                    <li className="flex items-start gap-3 text-sm text-gray-700">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      Total restructure of ads & retention flows.
                    </li>
                  </ul>
                </div>
              </div>
           </div>
        </section>

        {/* Results Section */}
        <section className="mb-24 px-4">
          <div className="bg-gradient-to-br from-gray-900 to-black text-white rounded-3xl p-10 md:p-16 shadow-2xl relative overflow-hidden text-center">
            
            <div className="absolute inset-0 bg-[url('/img/grid.svg')] opacity-10"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-orange-500/10 to-transparent"></div>

            <h2 className="text-3xl font-bold mb-12 relative z-10">The Results</h2>

            <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24 relative z-10">
              
              <div className="text-center opacity-60 transform scale-90">
                <p className="text-sm font-bold uppercase tracking-widest mb-4">Before</p>
                <div className="text-5xl md:text-6xl font-black text-red-500 line-through decoration-white/20 font-mono">$600+</div>
                <p className="mt-3 text-gray-400">CPA per FTD (DE)</p>
              </div>

              <div className="hidden md:block text-gray-600">
                <ArrowRight className="w-12 h-12" />
              </div>

              <div className="text-center transform md:scale-110">
                <p className="text-sm font-bold uppercase tracking-widest mb-4 text-green-400">After Audit</p>
                <div className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 font-mono">~$250</div>
                <p className="mt-3 text-green-400">CPA per FTD (DE)</p>
              </div>

            </div>

            <p className="mt-16 text-xl text-gray-300 max-w-2xl mx-auto border-t border-gray-800 pt-8 relative z-10">
              Transitioned from <span className="text-red-400">unscalable, expensive campaigns</span> to <span className="text-green-400 font-bold">profitable, scalable growth</span>.
            </p>
          </div>
        </section>

        {/* Feedback Section */}
        <section className="max-w-4xl mx-auto mb-20 bg-orange-50 border border-orange-100 rounded-2xl p-8 md:p-12">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-gray-900">
              <Users className="w-6 h-6 text-orange-600" />
              Client Feedback
            </h2>
            <div className="space-y-6">
               <blockquote className="bg-white p-6 rounded-xl shadow-sm border border-orange-100 italic text-gray-700 text-lg">
                 "It was valuable not just for the methodology, but that your product is constantly evolving — platform, Road Map, approaches regularly updated for Meta changes."
               </blockquote>
               <blockquote className="bg-white p-6 rounded-xl shadow-sm border border-orange-100 italic text-gray-700 text-lg">
                 "Total value from audit + training turned out significantly higher than expected from 'regular consulting'."
               </blockquote>
            </div>
        </section>

        {/* CTA */}
        <div className="text-center pb-12">
           <h2 className="text-3xl font-bold mb-8 text-gray-900">Ready to optimize your setup?</h2>
           <a href="https://t.me/nayborovskiy" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-10 py-5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all hover:scale-105 shadow-xl">
             <span>Contact Us</span>
             <ArrowRight className="w-5 h-5" />
           </a>
        </div>

      </div>
    </div>
  );
}
