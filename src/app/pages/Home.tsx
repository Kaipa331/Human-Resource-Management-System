import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Users, 
  BarChart3, 
  Zap, 
  ChevronRight, 
  ArrowRight,
  PlayCircle,
  Globe,
  Terminal,
  Share2,
  Menu,
  X
} from 'lucide-react';

export function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroPhotos = [
    {
      src: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80',
      alt: 'HR team collaborating around a conference table',
    },
    {
      src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80',
      alt: 'People discussing strategy in a bright office space',
    },
    {
      src: 'https://images.unsplash.com/photo-1543269664-28c5408b857c?auto=format&fit=crop&w=900&q=80',
      alt: 'Recruiter interviewing a candidate in a professional setting',
    },
    {
      src: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=900&q=80',
      alt: 'Employee reviewing paperwork and payroll documents',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-blue-100 selection:text-blue-900 transition-colors duration-500">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 right-[-8rem] h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute top-1/3 left-[-8rem] h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      {/* Premium Glass Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/85 dark:bg-slate-950/90 backdrop-blur-2xl border-b border-slate-200/60 dark:border-slate-800/60 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
        <div className="flex justify-between items-center px-4 md:px-12 py-4 md:py-5 max-w-[1400px] mx-auto">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:rotate-12 transition-transform duration-500">
              <Zap className="w-5 h-5 md:w-6 md:h-6 text-white fill-white" />
            </div>
            <span className="text-xl md:text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Lumina <span className="text-blue-600">HR</span></span>
          </div>
          
          <div className="hidden lg:flex items-center space-x-6 md:space-x-10">
            <a className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-500 transition-all uppercase tracking-widest" href="#features">Experience</a>
            <a className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-500 transition-all uppercase tracking-widest" href="#solutions">Intelligence</a>
            <a className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-500 transition-all uppercase tracking-widest" href="#impact">Impact</a>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {mobileMenuOpen ? <X className="w-6 h-6 text-slate-900 dark:text-white" /> : <Menu className="w-6 h-6 text-slate-900 dark:text-white" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-4 py-6 space-y-4">
            <a className="block py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-500 transition-all uppercase tracking-widest" href="#features" onClick={() => setMobileMenuOpen(false)}>Experience</a>
            <a className="block py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-500 transition-all uppercase tracking-widest" href="#solutions" onClick={() => setMobileMenuOpen(false)}>Intelligence</a>
            <a className="block py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-500 transition-all uppercase tracking-widest" href="#impact" onClick={() => setMobileMenuOpen(false)}>Impact</a>
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <a className="block w-full text-center px-6 py-3 text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest" href="#features" onClick={() => setMobileMenuOpen(false)}>
                Explore
              </a>
            </div>
          </div>
        )}
      </nav>

      <main>
        {/* Dynamic Hero Section */}
        <header className="relative pt-32 pb-16 md:pt-56 md:pb-36 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100/50 dark:bg-blue-900/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/50 dark:bg-emerald-900/10 rounded-full blur-[100px]" />
          </div>

          <div className="max-w-[1400px] mx-auto px-4 md:px-12 relative z-10">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 py-2 px-3 md:px-4 mb-6 md:mb-8 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/50">
                  <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                  <span className="text-[9px] md:text-[10px] font-black text-blue-700 dark:text-blue-300 uppercase tracking-[0.2em]">Next-Gen People Operations</span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-8xl font-black text-slate-900 dark:text-white leading-[0.95] md:leading-[0.9] mb-6 md:mb-10 tracking-tightest">
                  Designing the <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 underline decoration-emerald-200 dark:decoration-emerald-900/30">Future of Work</span>
                </h1>

                <p className="text-base md:text-xl lg:text-2xl text-slate-500 dark:text-slate-400 leading-relaxed mb-8 md:mb-12 max-w-2xl font-medium tracking-tight">
                  Experience a curated ecosystem where architectural precision meets human empathy. Lumina HR transforms complex admin into a seamless, high-velocity flow.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 md:gap-5">
                  <Link to="/login" className="group px-8 py-4 md:px-10 md:py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-base md:text-lg shadow-2xl shadow-blue-600/25 hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                    Login
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Button variant="outline" className="h-auto px-8 py-4 md:px-10 md:py-5 bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white rounded-2xl font-black text-base md:text-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center justify-center gap-3">
                    <PlayCircle className="w-6 h-6 text-blue-600" />
                    Watch Demo
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-blue-500/10 via-transparent to-emerald-500/10 blur-2xl" />
                <div className="relative grid grid-cols-2 gap-4 md:gap-5">
                  {heroPhotos.map((photo, index) => (
                    <div
                      key={photo.src}
                      className={`group relative overflow-hidden rounded-[2rem] border border-white/50 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 shadow-2xl shadow-slate-900/10 backdrop-blur-xl ${
                        index === 0 || index === 3 ? 'min-h-[200px] md:min-h-[280px]' : 'min-h-[160px] md:min-h-[220px] mt-6 md:mt-10'
                      }`}
                    >
                      <img
                        src={photo.src}
                        alt={photo.alt}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading={index === 0 ? 'eager' : 'lazy'}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
                      <div className="absolute left-4 right-4 bottom-4 flex items-end justify-between gap-3">
                        <div className="max-w-[70%]">
                          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/70">HR Focus</p>
                          <p className="mt-1 text-sm font-semibold text-white">{index % 2 === 0 ? 'People first' : 'Clear process'}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full border border-white/25 bg-white/15 backdrop-blur-md flex items-center justify-center text-white">
                          <Sparkles className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Feature Intelligence Grid */}
        <section id="features" className="py-20 md:py-32 bg-white/90 dark:bg-slate-950/90">
          <div className="max-w-[1400px] mx-auto px-4 md:px-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 md:mb-24 gap-6 md:gap-8">
              <div className="max-w-2xl">
                <h2 className="text-3xl md:text-4xl lg:text-6xl font-black text-slate-900 dark:text-white mb-4 md:mb-6 tracking-tight">Strategic Intelligence</h2>
                <p className="text-base md:text-xl text-slate-500 dark:text-slate-400 font-medium">Tools designed for the modern workspace, where every interaction is an opportunity for growth.</p>
              </div>
              <div className="hidden md:flex gap-4">
                <div className="w-14 h-14 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400">
                  <Users className="w-6 h-6" />
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                  <BarChart3 className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
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
              ].map((feature, i) => {
                const colorSchemes: Record<string, { bg: string; iconBg: string; iconColor: string; accent: string }> = {
                  blue: { bg: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30', iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600', iconColor: 'text-white', accent: 'border-blue-200 dark:border-blue-800' },
                  emerald: { bg: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30', iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600', iconColor: 'text-white', accent: 'border-emerald-200 dark:border-emerald-800' },
                  purple: { bg: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30', iconBg: 'bg-gradient-to-br from-purple-500 to-violet-600', iconColor: 'text-white', accent: 'border-purple-200 dark:border-purple-800' }
                };
                const scheme = colorSchemes[feature.color] || colorSchemes.blue;
                
                return (
                  <div key={i} className={`group p-6 md:p-10 ${scheme.bg} ${scheme.accent} border-2 rounded-[2rem] md:rounded-[2.5rem] hover:shadow-2xl hover:scale-[1.02] transition-all duration-500`}>
                    <div className={`w-14 h-14 md:w-16 md:h-16 ${scheme.iconBg} rounded-2xl flex items-center justify-center mb-6 md:mb-8 shadow-lg shadow-${feature.color}-500/30 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <feature.icon className={`w-6 h-6 md:w-8 md:h-8 ${scheme.iconColor}`} />
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-3 md:mb-4 uppercase tracking-tighter">{feature.title}</h3>
                    <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-6 md:mb-10">{feature.desc}</p>
                    <div className="flex items-center gap-2 text-xs md:text-sm font-black text-blue-600 uppercase tracking-widest cursor-pointer group-hover:gap-4 transition-all">
                      Explore <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Impact Metrics Section */}
        <section id="impact" className="py-20 md:py-32 bg-slate-50 dark:bg-slate-900/30">
          <div className="max-w-[1400px] mx-auto px-4 md:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-slate-900 dark:text-white mb-6 md:mb-8 tracking-tightest leading-tight">Quantifiable <br /> Excellence</h2>
                <p className="text-base md:text-xl text-slate-500 dark:text-slate-400 mb-8 md:mb-12 font-medium leading-relaxed">
                  Lumina HR is engineered to recover lost time and eliminate compliance risk through architectural precision and high-end automation.
                </p>
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                  <div className="p-6 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl md:rounded-3xl border-2 border-blue-200 dark:border-blue-800 shadow-lg shadow-blue-500/10">
                    <div className="text-4xl md:text-5xl font-black text-blue-600 mb-2 md:mb-3 tracking-tighter">40%</div>
                    <div className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Admin Reduction</div>
                  </div>
                  <div className="p-6 md:p-8 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-2xl md:rounded-3xl border-2 border-emerald-200 dark:border-emerald-800 shadow-lg shadow-emerald-500/10">
                    <div className="text-4xl md:text-5xl font-black text-emerald-500 mb-2 md:mb-3 tracking-tighter">99.9%</div>
                    <div className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Accuracy Rate</div>
                  </div>
                </div>
              </div>
              <div className="relative group order-first lg:order-last">
                <div className="aspect-square md:aspect-auto md:h-[500px] bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-3xl transform group-hover:rotate-2 transition-all duration-700">
                   <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
                   <div className="absolute inset-0 flex items-center justify-center p-8 md:p-12">
                      <div className="w-full aspect-square md:w-auto md:h-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl flex flex-col items-center justify-center gap-4 md:gap-6 p-6 md:p-12">
                        <div className="w-16 h-16 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                          <PlayCircle className="w-8 h-8 md:w-12 md:h-12 text-blue-600 fill-blue-600/10" />
                        </div>
                        <span className="text-white font-black text-sm md:text-lg uppercase tracking-[0.2em] md:tracking-[0.3em]">Watch Demo</span>
                      </div>
                   </div>
                </div>
                <div className="absolute -bottom-4 md:-bottom-8 -right-4 md:-right-8 bg-white dark:bg-slate-950 p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl md:rounded-2xl flex items-center justify-center text-emerald-600">
                    <ShieldCheck className="w-5 h-5 md:w-7 md:h-7" />
                  </div>
                  <div>
                    <div className="font-black text-xs md:text-sm text-slate-900 dark:text-white uppercase tracking-tighter">Enterprise Secure</div>
                    <div className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">ISO 27001 Certified</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-20 md:py-40 bg-white/90 dark:bg-slate-950/90 overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-4 md:px-12">
            <div className="relative bg-gradient-to-br from-slate-900 to-blue-600 dark:from-blue-600 dark:to-indigo-600 rounded-[2rem] md:rounded-[3.5rem] p-8 md:p-16 lg:p-32 text-center overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl lg:text-8xl font-black text-white mb-6 md:mb-10 tracking-tightest leading-[0.95] md:leading-[0.9]">Elevate your <br /> Workspace.</h2>
                <p className="text-base md:text-xl lg:text-2xl text-blue-100/70 mb-8 md:mb-16 max-w-2xl mx-auto font-medium">Join the vanguard of organizations using Lumina HR to create an exceptional work culture.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6">
                  <Link to="/login" className="px-8 py-4 md:px-12 md:py-5 bg-white text-slate-900 rounded-2xl font-black text-base md:text-xl shadow-2xl shadow-black/20 hover:scale-105 transition-all active:scale-95">
                  Explore Features
                  </Link>
                  <Button variant="outline" className="h-auto px-8 py-4 md:px-12 md:py-5 border-2 border-white/20 text-white rounded-2xl font-black text-base md:text-xl hover:bg-white/10 transition-all">
                    Talk to Sales
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full bg-slate-50 dark:bg-slate-950 border-t border-slate-200/70 dark:border-slate-900 py-12 md:py-20">
        <div className="max-w-[1400px] mx-auto px-4 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 mb-12 md:mb-20">
            <div className="max-w-md">
              <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-6 md:mb-8">Lumina HR</div>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6 md:mb-8">
                Architecting the future of HR through precision, empathy, and high-velocity automation. 
              </p>
              <div className="flex gap-3 md:gap-4">
                {[Globe, Terminal, Share2].map((Icon, i) => (
                  <div key={i} className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all cursor-pointer">
                    <Icon className="w-5 h-5" />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-10">
              {['Platform', 'Company', 'Resources'].map((category, i) => (
                <div key={i} className="space-y-4 md:space-y-6">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">{category}</h4>
                  <ul className="space-y-3 md:space-y-4">
                    {[1, 2, 3].map(j => (
                      <li key={j}>
                        <a className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors" href="#">Link Option {j}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-8 md:pt-10 border-t border-slate-200 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">© 2024 Lumina HR. All rights reserved.</p>
            <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] md:text-xs uppercase tracking-widest cursor-pointer group">
              Back to top 
              <ChevronRight className="w-4 h-4 -rotate-90 group-hover:-translate-y-1 transition-transform" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
