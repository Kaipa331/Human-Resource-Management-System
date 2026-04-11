import { Link } from 'react-router';
import { Button } from '../components/ui/button';

export function Home() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
          <div className="text-2xl font-bold tracking-tight text-blue-900">Lumina HR</div>
          <div className="hidden md:flex items-center space-x-8">
            <a className="text-blue-700 border-b-2 border-blue-700 pb-1 font-medium" href="#features">Features</a>
            <a className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium" href="#solutions">Solutions</a>
            <a className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium" href="#pricing">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="px-5 py-2 text-primary font-semibold hover:text-blue-800 transition-all">Login</Link>
            <Link to="/login" className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all">Get Started</Link>
          </div>
        </div>
      </nav>

      <header className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-surface">
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block py-1 px-3 mb-6 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-bold uppercase tracking-widest">Digital Atelier Experience</span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-on-surface leading-[1.05] mb-8 tracking-tight">
              The Future of <span className="text-primary">People Management</span>
            </h1>
            <p className="text-lg md:text-xl text-on-surface-variant leading-relaxed mb-10 max-w-2xl font-medium">
              Experience a curated workspace where precision meets empathy. Lumina HR transforms complex admin tasks into a seamless editorial flow, empowering your workforce with clarity and high-end automation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/login" className="px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-xl shadow-primary/25 hover:opacity-90 transition-all">
                Get Started
              </Link>
              <a href="#features" className="px-8 py-4 bg-surface-container-lowest text-primary rounded-xl font-bold text-lg flex items-center justify-center gap-2 border border-outline-variant/30 hover:bg-surface-container transition-all">
                <span className="material-symbols-outlined">play_circle</span>
                Watch Demo
              </a>
            </div>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-1/2 h-full hidden lg:block">
          <div className="relative w-full h-full">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl"></div>
            <img alt="HR Dashboard Preview" className="absolute top-1/2 right-[-10%] -translate-y-1/2 w-[120%] max-w-4xl rounded-2xl shadow-2xl border border-white/20" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCp2r4pLG9s46ODiUlj5Mkaj1retJKe5_xCvcoFwSXeLzG4zO_h_Bsj9ZnCDCyEfzD2je5croDf2t6aZ3cOnBgarJUgjzBO8MsG60IdN9iacpfHcIV3qu9n06N4exxByg-lrDLFHD6VOmGDjo2aoxqHD6Jqi69lPSoBGzS-zdBtewiNumr1CihVK4y_A99UDI-X2DHd16bDhQAFAlBPkiZKFgLTwrjzkjKHE75a4Fl_L2R_ZQdwB9D4i9eCmaW0EMr8W873qHTx-xI" />
          </div>
        </div>
      </header>

      <section id="solutions" className="py-16 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-8">
          <p className="text-center text-on-surface-variant text-sm font-semibold uppercase tracking-widest mb-10 opacity-60">Trusted by Global Innovators</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            <img alt="Partner Logo" className="h-8 w-auto" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD__TGXIKW3Qn6GGcxT8Dc9WyQhs3RBA6Vs3ccFKa3v2FDMuk6Ztq8YOIhklJlgl-orch3xRxivBzxmxeGo5f8uAmT9hxmmvOk3h1zGSFAY4_RY0B1zS7v_E5mrkO1vrLollP99buLYrRwXN8q9j01G9gU0DiGdda_Y94RjAgLgHAndI2uyqJOXN1C8Hl5yGTsknUyiHTAVYceOzjUh9_tTUaUR4-4iDrPO03UBNNLUQkt_X7E3fJUx3GD84DZQi7OqEhgUPus99IQ" />
            <img alt="Partner Logo" className="h-8 w-auto" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3u9hWCPQO0O-6_o9TtKygnV5lHD368e92K_v662fNeebATKXWR9e6Atgl6Sjlyn9-5TyCZaH3Mga307QUozhEka4DYJrxfUZ6xrDH830HPRVJrAg_aNOZxOuaErYiXImYWxgsu0Hrs9XyJJIzuzdkG6R4e530imgBARRpsadW8lNyH9IYHWp0wYEDfGrYw2nrwn_1phz6t5omBmhu5SYFfKHefA3F216pgWkgUvbSk0CCLgGowzz5wkVaxzWTPvycw2YuKmYyonw" />
            <img alt="Partner Logo" className="h-8 w-auto" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCi7sqFBCgzE3ZShkO4zmm3nasDnsagHElhVmKU-Hi-mI1sY_HccuJpJUC-3gTBfBamche6afkoRcOazzRYdvT0Z7tSxXIRCWoRU_O3wvHxKRWjPHBRkfrHjH1npDgKmtAjlbZ_3kr7qSaciLgjl2Zvd7bfy6laroPxrvBzhi6f-M_dboSxR0vLdH5U6Fp-Hwsi0egW__aPwzyIG9_yfoIpMDDrKuBT6ZheipKGC4k-O0oCsyD0Rf0hHgh-Z3be_40RARFWeqzvU_o" />
            <img alt="Partner Logo" className="h-8 w-auto" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxlbIuKM0PATq7p5ySIgA00vKn4ZF-RaheZJzK9cUCpwPoKcDZ_EmPdUo7AxJKSSQ46-04BMpAsgo8gcu2fcJs85lA8gIhGVcEnpP7xNVk-1AQ_hA7waCEjumHFK3NGiHJ_MWixixIKv4he985pL4Ctia60zcDCTchPXKG_Qpy8SJdiQw4lpBaSi41LOs3vSP3I46IRfrFddh4aVk7CXy3CdO5un0mfPIxme4QCyp-NF8SVqpFvTqv4MIhy3rotQ_iGMOs4Z0daNQ" />
            <img alt="Partner Logo" className="h-8 w-auto" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDygmpfwQ2uE1pJbsoTIj7Sko29uvCBsIfiBxMPwDND5V4S4EGf-Ven5-5wIceSw3k6US9Td0Bmwu9T8-TrfQfTlLa8lU3WvZupvzvKYll9zhrVdZr36Ve0ZidFYHe1wiWYcOZNQlIEFGtRC5MpK1nsqRhbqtcToFB_A9Hf1j_TXJm7j3DPaWIXBlyA1dFmRJ-dnFBrWoCVqFMtAIsmBNOU3knPC9ND_bMG6SHqRqMSlxfmX1nXco7OYjM2tF7JTS1V2UdENL60cIg" />
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-8">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-4">Masterfully Crafted Features</h2>
            <p className="text-on-surface-variant max-w-2xl font-medium">Elevate your operational excellence with tools designed for the modern atelier of work.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 group bg-surface-container-lowest p-10 rounded-[2rem] border border-outline-variant/10 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="w-14 h-14 bg-primary-fixed rounded-2xl flex items-center justify-center mb-8 text-primary group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl">person_celebrate</span>
                  </div>
                  <h3 className="text-2xl font-bold text-on-surface mb-4">Employee Self-Service</h3>
                  <p className="text-on-surface-variant max-w-md leading-relaxed">Give your team the autonomy they deserve. A bespoke portal for leave requests, document management, and personal growth tracking.</p>
                </div>
                <div className="mt-12 flex items-center text-primary font-bold gap-2 cursor-pointer">
                  Learn more <span className="material-symbols-outlined">arrow_forward</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-4 group bg-primary p-10 rounded-[2rem] text-on-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-500">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Payroll Automation</h3>
              <p className="text-on-primary/80 leading-relaxed">Error-free compensation with a single click. Seamless tax integration and automated compliance.</p>
            </div>

            <div className="md:col-span-4 group bg-surface-container-low p-10 rounded-[2rem] border border-outline-variant/10 hover:shadow-xl transition-all duration-500">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-8 text-primary">
                <span className="material-symbols-outlined text-3xl">analytics</span>
              </div>
              <h3 className="text-2xl font-bold text-on-surface mb-4">Performance Intelligence</h3>
              <p className="text-on-surface-variant leading-relaxed">Go beyond simple reviews. Leverage data-driven insights to nurture talent and align goals.</p>
            </div>

            <div className="md:col-span-8 group bg-surface-container-lowest p-10 rounded-[2rem] border border-outline-variant/10 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden relative">
              <div className="relative z-10">
                <div className="w-14 h-14 bg-primary-fixed rounded-2xl flex items-center justify-center mb-8 text-primary">
                  <span className="material-symbols-outlined text-3xl">group_add</span>
                </div>
                <h3 className="text-2xl font-bold text-on-surface mb-4">Recruitment Pipeline</h3>
                <p className="text-on-surface-variant max-w-sm leading-relaxed">An editorial-style workflow for finding and onboarding your next industry leaders. Seamless, visual, and highly efficient.</p>
              </div>
              <img alt="Recruitment Pipeline UI" className="absolute bottom-[-20%] right-[-10%] w-2/3 rounded-xl shadow-2xl opacity-40 group-hover:opacity-100 transition-opacity duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4VyuQnt77cP6s8fCmfM4qdF1l3S1_3f7IJu2ENPbarLzAcfpJATknxYYLLYp8A1BACpCULsQ3TiEEIbfhgznadzKSKvPlG9Jnwynpt26NKsbkyKxscx38QIjsBAKgkjF2fgw0JGq91_cZloIlDiZB0vPQwaaYVorYL4taHpXK0XTrlyIx1yL8FdV0e022KI8yQFzN07Xopg6mPortoAt_gOipbX8ii4WE2yH8cPKVA-oWzzVYuLG0eCijvi8tuELDcj-HF8N3-h0" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-on-surface mb-6 leading-tight">Quantifiable Excellence for High-Performing Teams</h2>
              <p className="text-on-surface-variant text-lg mb-8 leading-relaxed">We don't just organize; we optimize. Lumina HR is engineered to recover lost time and eliminate compliance risk through architectural precision.</p>
              <div className="flex items-center gap-6">
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-outline-variant/10">
                  <div className="text-4xl font-extrabold text-primary mb-2">40%</div>
                  <div className="text-sm font-bold text-on-surface-variant uppercase tracking-tighter">Reduction in Admin</div>
                </div>
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-outline-variant/10">
                  <div className="text-4xl font-extrabold text-primary mb-2">98%</div>
                  <div className="text-sm font-bold text-on-surface-variant uppercase tracking-tighter">Compliance Accuracy</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video bg-primary-container rounded-[2rem] overflow-hidden shadow-2xl relative group">
                <img alt="Data Analytics Visual" className="w-full h-full object-cover mix-blend-overlay opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAaOGZLLDkTs76NKmFxtFjFwVXRHajoCdLo56jhqsAGKTGqyc4hmTsFjl6ulN-Jd-5RFKuRWFyYCnR4QOCoDZiz4ayq06du7p51YCJwRJLmKeQvSxKJmsZZ9ZQsN-RY2_Y-NXVeRHHEGtc249Iu24Z8ZAYNcVU7cQutm9DjyaM5fb6WgaQn536uO6JmsGV40PNcmyBdXaH8Y7hC3YkkZPcVlYwPX1nVd5ja4EH3MdceX_JSHaHXqR-Uo9yCMGRUjOOa25w_p2oqHPI" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 cursor-pointer hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-outline-variant/10 hidden md:block">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">verified</span>
                  </div>
                  <div>
                    <div className="font-bold text-on-surface">ISO 27001 Certified</div>
                    <div className="text-xs text-on-surface-variant font-medium">Enterprise-grade security</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-8">
          <div className="gradient-primary rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" width="100%">
                <defs>
                  <pattern height="10" id="grid" patternUnits="userSpaceOnUse" width="10">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" stroke-width="0.5"></path>
                  </pattern>
                </defs>
                <rect fill="url(#grid)" height="100%" width="100%"></rect>
              </svg>
            </div>
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-8 tracking-tight">Ready to Elevate Your Workspace?</h2>
              <p className="text-on-primary-container text-lg md:text-xl mb-12 font-medium opacity-90">Join the vanguard of modern organizations using Lumina HR to create an exceptional work culture.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/login" className="px-10 py-5 bg-white text-primary rounded-xl font-extrabold text-lg shadow-xl shadow-black/10 hover:bg-surface-container transition-all active:scale-95">
                  Sign Up Today
                </Link>
                <Link to="/login" className="px-10 py-5 border border-white/30 text-white rounded-xl font-extrabold text-lg hover:bg-white/10 transition-all">
                  Talk to Sales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="w-full border-t border-slate-200 bg-slate-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-8 py-12 max-w-7xl mx-auto">
          <div className="space-y-6">
            <div className="text-lg font-bold text-blue-900">Lumina HR</div>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm font-medium text-sm">
              Designing the future of people management through the lens of architectural precision and human-centric empathy.
            </p>
            <div className="flex gap-4">
              <a className="text-slate-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">public</span></a>
              <a className="text-slate-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">terminal</span></a>
              <a className="text-slate-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">share</span></a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-on-surface font-bold text-sm uppercase tracking-widest">Platform</h4>
              <ul className="space-y-2">
                <li><a className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-400 underline" href="#features">Features</a></li>
                <li><a className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-400 underline" href="#solutions">Solutions</a></li>
                <li><a className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-400 underline" href="#pricing">Pricing</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-on-surface font-bold text-sm uppercase tracking-widest">Company</h4>
              <ul className="space-y-2">
                <li><a className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-400 underline" href="#">Privacy Policy</a></li>
                <li><a className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-400 underline" href="#">Terms of Service</a></li>
                <li><a className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-400 underline" href="#">Contact Us</a></li>
                <li><a className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-400 underline" href="#">Resources</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-8 py-6 border-t border-slate-200 flex justify-between items-center">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">© 2024 Lumina HRMS. All rights reserved.</p>
          <div className="flex items-center gap-2 text-primary font-semibold text-xs cursor-pointer">
            Back to top <span className="material-symbols-outlined text-sm">arrow_upward</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
