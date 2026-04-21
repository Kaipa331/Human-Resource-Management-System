import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { 
  Sparkles, 
  ShieldCheck, 
  Users, 
  BarChart3, 
  Zap, 
  Clock, 
  ChevronRight, 
  ArrowRight,
  PlayCircle,
  Globe,
  Terminal,
  Share2
} from 'lucide-react';

export function Home() {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-slate-950 selection:bg-blue-100 selection:text-blue-900 transition-colors duration-500">
      {/* Premium Glass Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/60 dark:bg-slate-950/60 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex justify-between items-center px-6 md:px-12 py-5 max-w-[1400px] mx-auto">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:rotate-12 transition-transform duration-500">
              <Zap className="w-6 h-6 text-white fill-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Lumina <span className="text-blue-600">HR</span></span>
          </div>
          
          <div className="hidden lg:flex items-center space-x-10">
            <a className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-500 transition-all uppercase tracking-widest" href="#features">Experience</a>
            <a className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-500 transition-all uppercase tracking-widest" href="#solutions">Intelligence</a>
            <a className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-500 transition-all uppercase tracking-widest" href="#impact">Impact</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="px-6 py-2.5 text-sm font-black text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors uppercase tracking-widest">
              Login
            </Link>
            <Link to="/login" className="hidden sm:flex px-7 py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-full font-black text-sm shadow-xl shadow-slate-900/10 dark:shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest">
              Register
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Dynamic Hero Section */}
        <header className="relative pt-40 pb-20 md:pt-64 md:pb-48 overflow-hidden bg-[#fafafa] dark:bg-slate-950">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100/50 dark:bg-blue-900/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/50 dark:bg-emerald-900/10 rounded-full blur-[100px]" />
          </div>

          <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 py-2 px-4 mb-8 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                <span className="text-[10px] font-black text-blue-700 dark:text-blue-300 uppercase tracking-[0.2em]">Next-Gen People Operations</span>
              </div>
              
              <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white leading-[0.9] mb-10 tracking-tightest">
                Designing the <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500 underline decoration-emerald-200 dark:decoration-emerald-900/30">Future of Work</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 leading-relaxed mb-12 max-w-2xl font-medium tracking-tight">
                Experience a curated ecosystem where architectural precision meets human empathy. Lumina HR transforms complex admin into a seamless, high-velocity flow.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-5">
                <Link to="/login" className="group px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                  Get Started 
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Button variant="ghost" className="h-auto px-10 py-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl font-black text-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center justify-center gap-3">
                  <PlayCircle className="w-6 h-6 text-blue-600" />
                  Watch Demo
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Feature Intelligence Grid */}
        <section id="features" className="py-32 bg-white dark:bg-slate-950">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-8">
              <div className="max-w-2xl">
                <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">Strategic Intelligence</h2>
                <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">Tools designed for the modern workspace, where every interaction is an opportunity for growth.</p>
              </div>
              <div className="hidden md:flex gap-4">
                <div className="w-14 h-14 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400">
                  <Users className="w-6 h-6" />
                </div>
                <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                  <BarChart3 className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Self-Service",
                  desc: "Give your team the autonomy they deserve with a bespoke portal for leave, docs, and growth.",
                  icon: Users,
                  color: "blue"
                },
                {
                  title: "Payroll Automation",
                  desc: "Precision compensation with a single click. Seamless tax integration and audit-ready reports.",
                  icon: Zap,
                  color: "emerald"
                },
                {
                  title: "Performance IQ",
                  desc: "Go beyond reviews. Leverage data-driven insights to nurture talent and align goals.",
                  icon: BarChart3,
                  color: "purple"
                }
              ].map((feature, i) => (
                <div key={i} className="group p-10 bg-[#fcfcfc] dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500">
                  <div className={`w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-8 text-blue-500`}>
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">{feature.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-10">{feature.desc}</p>
                  <div className="flex items-center gap-2 text-sm font-black text-blue-600 uppercase tracking-widest cursor-pointer group-hover:gap-4 transition-all">
                    Explore <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Impact Metrics Section */}
        <section id="impact" className="py-32 bg-slate-50 dark:bg-slate-900/30">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-8 tracking-tightest leading-tight">Quantifiable <br /> Excellence</h2>
                <p className="text-xl text-slate-500 dark:text-slate-400 mb-12 font-medium leading-relaxed">
                  Lumina HR is engineered to recover lost time and eliminate compliance risk through architectural precision and high-end automation.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-8 bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="text-5xl font-black text-blue-600 mb-3 tracking-tighter">40%</div>
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Admin Reduction</div>
                  </div>
                  <div className="p-8 bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="text-5xl font-black text-emerald-500 mb-3 tracking-tighter">99.9%</div>
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Accuracy Rate</div>
                  </div>
                </div>
              </div>
              <div className="relative group">
                <div className="aspect-square bg-gradient-to-br from-blue-600 to-emerald-500 rounded-[3rem] overflow-hidden shadow-3xl transform group-hover:rotate-2 transition-all duration-700">
                   <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
                   <div className="absolute inset-0 flex items-center justify-center p-12">
                      <div className="w-full aspect-square bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center gap-6">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                          <PlayCircle className="w-12 h-12 text-blue-600 fill-blue-600/10" />
                        </div>
                        <span className="text-white font-black text-lg uppercase tracking-[0.3em]">Watch Demo</span>
                      </div>
                   </div>
                </div>
                <div className="absolute -bottom-8 -right-8 bg-white dark:bg-slate-950 p-6 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">Enterprise Secure</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">ISO 27001 Certified</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-40 bg-white dark:bg-slate-950 overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <div className="relative bg-slate-900 dark:bg-blue-600 rounded-[3.5rem] p-12 md:p-32 text-center overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
              <div className="relative z-10">
                <h2 className="text-5xl md:text-8xl font-black text-white mb-10 tracking-tightest leading-[0.9]">Elevate your <br /> Workspace.</h2>
                <p className="text-xl md:text-2xl text-blue-100/70 mb-16 max-w-2xl mx-auto font-medium">Join the vanguard of organizations using Lumina HR to create an exceptional work culture.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-6">
                  <Link to="/login" className="px-12 py-5 bg-white text-slate-900 rounded-2xl font-black text-xl shadow-2xl shadow-black/20 hover:scale-105 transition-all active:scale-95">
                    Sign Up Free
                  </Link>
                  <Button variant="outline" className="h-auto px-12 py-5 border-2 border-white/20 text-white rounded-2xl font-black text-xl hover:bg-white/10 transition-all">
                    Talk to Sales
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full bg-[#fafafa] dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 py-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-20">
            <div className="max-w-md">
              <div className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-8">Lumina HR</div>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
                Architecting the future of HR through precision, empathy, and high-velocity automation. 
              </p>
              <div className="flex gap-4">
                {[Globe, Terminal, Share2].map((Icon, i) => (
                  <div key={i} className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all cursor-pointer">
                    <Icon className="w-5 h-5" />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
              {['Platform', 'Company', 'Resources'].map((category, i) => (
                <div key={i} className="space-y-6">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">{category}</h4>
                  <ul className="space-y-4">
                    {[1, 2, 3].map(j => (
                      <li key={j}>
                        <a className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors" href="#">Link Option {j}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-10 border-t border-slate-200 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">© 2024 Lumina HR. All rights reserved.</p>
            <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest cursor-pointer group">
              Back to top 
              <ChevronRight className="w-4 h-4 -rotate-90 group-hover:-translate-y-1 transition-transform" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
