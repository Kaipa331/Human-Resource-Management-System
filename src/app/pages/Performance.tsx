import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

export function Performance() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: '',
    dueDate: ''
  });
  const [isNewReviewOpen, setIsNewReviewOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(false);
    try {
      const { data: revs, error: errRevs } = await supabase.from('performance_reviews').select('*, employees(name, employee_id)');
      if (errRevs && errRevs.code !== '42P01') console.error('Error reviews', errRevs);
      else if (revs) setReviews(revs.map(r => ({ ...r, employeeName: r.employees?.name || 'Unknown', employeeCode: r.employees?.employee_id || r.employee_id})));

      const { data: gs, error: errGs } = await supabase.from('performance_goals').select('*');
      if (errGs && errGs.code !== '42P01') console.error('Error goals', errGs);
      else if (gs) setGoals(gs);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal.title || !newGoal.dueDate) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('hrms_user') || '{}');
      const { data: empData } = await supabase.from('employees').select('id').eq('email', user?.email || '').maybeSingle();
      const employeeId = empData?.id;

      if (!employeeId) {
        toast.error('You need an linked employee account to post a goal.');
        return;
      }

      const { data, error } = await supabase.from('performance_goals').insert([{
        employee_id: employeeId,
        title: newGoal.title,
        description: newGoal.description,
        category: newGoal.category,
        due_date: newGoal.dueDate,
        progress: 0,
        status: 'Not Started'
      }]).select();

      if (error && error.code !== '42P01') throw error;
      
      if (data) {
        setGoals([...goals, data[0]]);
      } else {
        setGoals([...goals, { ...newGoal, id: 'tmp'+Date.now(), progress: 0, status: 'Not Started', start_date: new Date().toISOString() }]);
      }
      toast.success('Goal created successfully');
      setNewGoal({ title: '', description: '', category: '', dueDate: '' });
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface dark:text-white">Performance Intelligence</h1>
        <p className="text-on-surface-variant mt-2 font-medium">Tracking organizational growth and individual excellence.</p>
      </div>
      <div className="flex gap-3">
        <button className="px-5 py-2.5 bg-surface-container-lowest text-primary font-semibold rounded-xl shadow-sm border border-outline-variant/10 hover:bg-surface transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]" data-icon="file_download">file_download</span> Export Data
        </button>
        <Dialog open={isNewReviewOpen} onOpenChange={setIsNewReviewOpen}>
          <button 
            onClick={() => setIsNewReviewOpen(true)}
            className="px-5 py-2.5 bg-primary text-on-primary font-semibold rounded-xl shadow-md hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]" data-icon="add">add</span> New Review
          </button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>Set a new performance goal</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Goal Title</Label>
                <Input value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} placeholder="e.g. Complete certification" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={newGoal.description} onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })} placeholder="Describe the goal..." rows={3} />
              </div>
              <div>
                <Label>Category</Label>
                <Input value={newGoal.category} onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })} placeholder="e.g. Skills Development" />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={newGoal.dueDate} onChange={(e) => setNewGoal({ ...newGoal, dueDate: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleAddGoal} className="mt-4 w-full">Create Goal</Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dashboard Bento Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Performance Overview Card */}
        <div className="md:col-span-8 bg-surface-container-lowest rounded-3xl p-8 shadow-[0px_12px_32px_rgba(15,23,42,0.06)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-xl font-bold text-on-surface">Organizational Health</h3>
                <p className="text-sm text-on-surface-variant font-medium">Average Performance Rating Q3</p>
              </div>
              <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">trending_up</span> +4.2%
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="space-y-2">
                <div className="text-4xl font-extrabold text-primary">4.8<span className="text-xl font-medium text-slate-400">/5</span></div>
                <div className="flex text-primary">
                  {[...Array(4)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                  ))}
                  <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 0.8"}}>star</span>
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Employee Satisfaction</p>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-extrabold text-primary">92%</div>
                <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[92%] rounded-full"></div>
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Goal Completion Rate</p>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-extrabold text-primary">12</div>
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-blue-200 border-2 border-white"></div>
                  <div className="w-7 h-7 rounded-full bg-blue-300 border-2 border-white"></div>
                  <div className="w-7 h-7 rounded-full bg-blue-400 border-2 border-white"></div>
                  <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">+9</div>
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Top Performers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Reviews Card */}
        <div className="md:col-span-4 bg-primary-container rounded-3xl p-8 text-on-primary shadow-lg flex flex-col">
          <h3 className="text-xl font-bold mb-6">Upcoming Reviews</h3>
          <div className="space-y-5 flex-1">
            <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex flex-col items-center justify-center">
                <span className="text-xs font-bold">SEP</span>
                <span className="text-lg font-black leading-none">12</span>
              </div>
              <div>
                <p className="font-bold">Quarterly Review</p>
                <p className="text-xs text-white/70 font-medium">Design Department</p>
              </div>
              <button className="ml-auto w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex flex-col items-center justify-center">
                <span className="text-xs font-bold">SEP</span>
                <span className="text-lg font-black leading-none">15</span>
              </div>
              <div>
                <p className="font-bold">Annual Appraisal</p>
                <p className="text-xs text-white/70 font-medium">Dev Operations</p>
              </div>
              <button className="ml-auto w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
          <button className="w-full mt-6 py-3 bg-white text-primary font-bold rounded-xl text-sm hover:bg-gray-50 transition-colors">View Calendar</button>
        </div>

        {/* Goal Tracking Section */}
        <div className="md:col-span-12 lg:col-span-7 bg-surface-container-lowest rounded-3xl p-8 shadow-[0px_12px_32px_rgba(15,23,42,0.06)]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-on-surface">Departmental Goal Tracking</h3>
            <span className="text-sm font-semibold text-primary cursor-pointer hover:opacity-75">View All</span>
          </div>
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-on-surface">Creative &amp; Brand Experience</span>
                <span className="text-sm font-bold text-primary">85%</span>
              </div>
              <div className="w-full h-3 bg-surface-container-low rounded-full">
                <div className="bg-gradient-to-r from-blue-700 to-blue-400 h-full w-[85%] rounded-full shadow-[0px_0px_12px_rgba(55,85,195,0.3)]"></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                <span>12/15 Objectives</span>
                <span>3 Days Remaining</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-on-surface">Engineering &amp; Systems</span>
                <span className="text-sm font-bold text-primary">62%</span>
              </div>
              <div className="w-full h-3 bg-surface-container-low rounded-full">
                <div className="bg-gradient-to-r from-blue-700 to-blue-400 h-full w-[62%] rounded-full shadow-[0px_0px_12px_rgba(55,85,195,0.3)]"></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                <span>18/29 Objectives</span>
                <span>14 Days Remaining</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-on-surface">Revenue &amp; Growth</span>
                <span className="text-sm font-bold text-primary">94%</span>
              </div>
              <div className="w-full h-3 bg-surface-container-low rounded-full">
                <div className="bg-gradient-to-r from-blue-700 to-blue-400 h-full w-[94%] rounded-full shadow-[0px_0px_12px_rgba(55,85,195,0.3)]"></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                <span>24/25 Objectives</span>
                <span>Completed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Star Performers List */}
        <div className="md:col-span-12 lg:col-span-5 bg-surface-container-lowest rounded-3xl p-8 shadow-[0px_12px_32px_rgba(15,23,42,0.06)]">
          <h3 className="text-xl font-bold text-on-surface mb-8">Performance Leaderboard</h3>
          <div className="space-y-6">
            {/* Employee Item */}
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="relative">
                <img alt="Sarah Chen" className="w-12 h-12 rounded-2xl object-cover" data-alt="close-up portrait of a professional woman with a soft confident expression in a bright studio" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcIuNypyzw9dDXfis1FyH8nOS4oDnIvd-ZCaWPrU4AXSuh1u-GTc_Vqxe6SE8YafUYvoZIyxycMF5H5I1ba7zZDLN_grRc2JgPM7Sqsm1KMcRq2MQFG6or-szFA-HPixyTVSyff2wPAwmFN_aH9nD-4p8lyKjmjP4u34nrz070On1cKOaeIMGhcgGr4bbDeyQ7C-pkOKsVQ9FxYAnRkrGXdjpfGE1vVPXATAkQurOcKG4JIOgJVB7B6FIivQJR8sEOtJx_3FK1S_o" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[12px] text-white" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="font-bold text-on-surface">Sarah Chen</p>
                <p className="text-xs text-on-surface-variant">Senior Product Designer</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-blue-900">4.9/5.0</p>
                <p className="text-[10px] text-green-600 font-bold uppercase">Top 1%</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="relative">
                <img alt="Marcus Thompson" className="w-12 h-12 rounded-2xl object-cover" data-alt="professional portrait of a man in business casual attire with natural office background lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEaCaowPTS9bsxyW58_LDXijjaxkUuHfZWAHQSMemv9TFmRs0HMD-tc3LAS1h9ap0XYvO2p_LfBvT9PCG1OjUrFBz8GUoXE3jnuv3LsZOYhK7CgFSfLWIcAW5VUmBWhvbv0xxDChLr0MvVJCQoTzRmVFVZ9FGIqq5k2cz2VgFkrakG-fBP2T3uuJwohrl8cBP8mzjGmadNAtQNV7qKJSygith7NVRfKbGYZEGcyizmQKBmUyz68jI0J5js83BxxtlEwpFHpgVwLKQ" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-100 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[12px] text-blue-900" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="font-bold text-on-surface">Marcus Thompson</p>
                <p className="text-xs text-on-surface-variant">Lead Backend Dev</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-blue-900">4.7/5.0</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Top 5%</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="relative">
                <img alt="Elena Rodriguez" className="w-12 h-12 rounded-2xl object-cover" data-alt="portrait of a woman in a light-filled office environment with soft focus greenery in the background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCy2kssExokgke6QDhmSbV4fB16y8MtrWUT0nG_y1zdLsWDnWDBtzlnxPR9by6CYCx5v4HKv5QICMxE9n-ZnCffUAWwf69gx62j_ApTiGNFqvaPD4rnTcxpYaJyM_ZxrrHx9j8F3kTixj2ycHWp4qhNiJnxAQooMZdb0cbohTHqTHOKm04jA2I5sCkN6XFFXT-wPYxArblKodphvRo3-RIsdVKZdDbzIjmIiR49z4_sfRlhj4XnAMHELL5ExhUbjHOu1e2nMk9xfaU" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-on-surface">Elena Rodriguez</p>
                <p className="text-xs text-on-surface-variant">Growth Specialist</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-blue-900">4.6/5.0</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Steady Grow</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="relative">
                <img alt="David Park" className="w-12 h-12 rounded-2xl object-cover" data-alt="middle-aged male professional smiling gently with warm soft lighting in a modern interior" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDi2ToqZ10TM2f7koUFHzAOTw_CscOLpJjC8euvH8fP79jeDc5CPoHTM8e0tPH-eJQ4qgOsnNXvm4uLUdPYv2YF38RZNjxlQpX1L8voUSjaxE52WafNXDA3hlztuSIxTmRuwEh_g5cfr7T3wB7tKTSh9DfDQM7cHMPQgqd_k09H0kv7p2XZ8he3FiDekcousVMmnTR896ydCwL503S4Ez1_4PqjDqhNNHb4-4LabnFPaf4lxtBe_t-XT1nB3pLwmZssqeFCXlkT-Og" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-on-surface">David Park</p>
                <p className="text-xs text-on-surface-variant">UX Researcher</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-blue-900">4.5/5.0</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Reliable</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
