import { useEffect, useState } from 'react';
import { Users, UserPlus, Trophy, Plus, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useHydrationStore } from '../lib/hydration-store';

export default function Groups() {
  const { user } = useHydrationStore();
  
  // Views: 'list' | 'create' | 'join' | 'leaderboard'
  const [view, setView] = useState('list');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeGroupName, setActiveGroupName] = useState('');
  
  // State for Create/Join
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch the groups the user is part of
  const fetchMyGroups = async () => {
    if (!user) return;
    setLoading(true);
    
    // FIX: Removed unused 'error' variable to pass Vercel build
    const { data } = await supabase
      .from('group_members')
      .select(`group_id, groups (name, code)`)
      .eq('user_id', user.id);
      
    if (data) {
      setMyGroups(data.map((m: any) => ({ 
        id: m.group_id, 
        name: m.groups?.name || 'Unknown Group', 
        code: m.groups?.code || '' 
      })));
    }
    setLoading(false);
  };

  // Load groups when returning to the list view
  useEffect(() => {
    if (view === 'list') fetchMyGroups();
  }, [view, user]);

  // Real-time listener: Auto-update leaderboard if someone logs water
  useEffect(() => {
    if (view === 'leaderboard' && activeGroupId) {
      const channel = supabase.channel('public:water_logs')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'water_logs' }, () => {
          loadLeaderboard(activeGroupId, activeGroupName);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [view, activeGroupId, activeGroupName]);

  // Handle WhatsApp-style Group Creation
  const handleCreateGroup = async () => {
    if (!groupName || !user) return;
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // FIX: Removed unused 'error' variable here as well
    const { data: group } = await supabase
      .from('groups')
      .insert([{ name: groupName, code: randomCode, created_by: user.id }])
      .select().single();
      
    if (group) {
      await supabase.from('group_members').insert([{ group_id: group.id, user_id: user.id }]);
      setGroupName('');
      setView('list');
    } else {
      alert("Error creating group.");
    }
  };

  // Handle Joining with Code
  const handleJoinGroup = async () => {
    if (!joinCode || !user) return;
    const code = joinCode.toUpperCase();
    
    const { data: group } = await supabase.from('groups').select('id').eq('code', code).single();
    if (group) {
      const { error } = await supabase.from('group_members').insert([{ group_id: group.id, user_id: user.id }]);
      if (error) {
        alert("You are already in this group!");
      } else {
        setJoinCode('');
        setView('list');
      }
    } else {
      alert("Invalid group code! Please check and try again.");
    }
  };

  // Fetch specific Leaderboard when a group is clicked
  const loadLeaderboard = async (groupId: string, name: string) => {
    setActiveGroupId(groupId);
    setActiveGroupName(name);
    setView('leaderboard');
    setLoading(true);

    const { data: members } = await supabase.from('group_members').select('user_id').eq('group_id', groupId);
    if (!members) return;
    const memberIds = members.map((m: any) => m.user_id);

    const { data: profiles } = await supabase.from('profiles').select('id, full_name, daily_goal').in('id', memberIds);
    const today = new Date().toISOString().split('T')[0];
    const { data: logs } = await supabase.from('water_logs').select('user_id, amount').gte('created_at', today).in('user_id', memberIds);

    const logTotals: Record<string, number> = {};
    logs?.forEach((log: any) => { logTotals[log.user_id] = (logTotals[log.user_id] || 0) + log.amount; });

    const board = profiles?.map((p: any) => {
      const intake = logTotals[p.id] || 0;
      const goal = p.daily_goal || 2500;
      return {
        id: p.id,
        name: p.full_name || 'Anonymous',
        initials: (p.full_name || 'U').substring(0, 2).toUpperCase(),
        percentage: Math.min(100, (intake / goal) * 100),
        isMe: p.id === user?.id
      };
    }).sort((a: any, b: any) => b.percentage - a.percentage);

    setLeaderboard(board || []);
    setLoading(false);
  };

  return (
    <div className="p-4 space-y-6 pb-24 bg-[#0B1120] min-h-screen text-slate-50">
      <h1 className="text-2xl font-bold pt-2">{view === 'leaderboard' ? activeGroupName : 'Family Groups'}</h1>

      {/* VIEW: MAIN LIST */}
      {view === 'list' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setView('create')} className="bg-[#161F32] border border-slate-800 p-6 rounded-[24px] flex flex-col items-center gap-3 active:scale-95 transition-transform shadow-lg">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-full flex items-center justify-center">
                <Plus className="w-6 h-6 text-cyan-400" />
              </div>
              <span className="font-bold text-sm">Create Group</span>
            </button>
            <button onClick={() => setView('join')} className="bg-[#161F32] border border-slate-800 p-6 rounded-[24px] flex flex-col items-center gap-3 active:scale-95 transition-transform shadow-lg">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-full flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-cyan-400" />
              </div>
              <span className="font-bold text-sm">Join Group</span>
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Your Active Groups</h3>
            {loading ? <p className="text-sm text-slate-500 text-center py-4 animate-pulse">Loading groups...</p> : null}
            {!loading && myGroups.length === 0 ? (
              <p className="text-sm text-slate-500 text-center p-8 bg-slate-800/10 border-2 border-dashed border-slate-800 rounded-[32px]">You haven't joined any groups yet.</p>
            ) : (
              myGroups.map((group) => (
                <button 
                  key={group.id} 
                  onClick={() => loadLeaderboard(group.id, group.name)}
                  className="w-full bg-[#161F32] border border-slate-800 p-5 rounded-[24px] flex items-center justify-between shadow-lg active:scale-95 transition-transform text-left group-btn"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
                      <Users className="w-6 h-6 text-cyan-500/80" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100">{group.name}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Code: {group.code}</p>
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-slate-600 rotate-180" />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW: CREATE GROUP */}
      {view === 'create' && (
        <div className="bg-[#161F32] border border-slate-800 rounded-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom-8">
          <h2 className="text-xl font-bold mb-4">Create New Group</h2>
          <input 
            type="text" placeholder="Group Name (e.g. Family)" autoFocus
            value={groupName} onChange={(e) => setGroupName(e.target.value)} 
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 mb-6 focus:border-cyan-500 outline-none text-white" 
          />
          <div className="flex gap-3">
            <button onClick={() => setView('list')} className="flex-1 py-4 bg-slate-800 rounded-2xl font-bold">Cancel</button>
            <button onClick={handleCreateGroup} className="flex-[2] py-4 bg-cyan-500 text-white rounded-2xl font-bold active:scale-95 transition-transform">Create</button>
          </div>
        </div>
      )}

      {/* VIEW: JOIN GROUP */}
      {view === 'join' && (
        <div className="bg-[#161F32] border border-slate-800 rounded-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom-8">
          <h2 className="text-xl font-bold mb-2">Join with Code</h2>
          <p className="text-xs text-slate-400 mb-6">Enter the 6-digit code shared by your friend.</p>
          <input 
            type="text" placeholder="Enter Code (e.g. X7B9QA)" autoFocus
            value={joinCode} onChange={(e) => setJoinCode(e.target.value)} 
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 mb-6 focus:border-cyan-500 outline-none text-center font-black tracking-widest uppercase text-white" 
          />
          <div className="flex gap-3">
            <button onClick={() => setView('list')} className="flex-1 py-4 bg-slate-800 rounded-2xl font-bold">Cancel</button>
            <button onClick={handleJoinGroup} className="flex-[2] py-4 bg-cyan-500 text-white rounded-2xl font-bold active:scale-95 transition-transform">Join</button>
          </div>
        </div>
      )}

      {/* VIEW: LEADERBOARD */}
      {view === 'leaderboard' && (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
          <button onClick={() => setView('list')} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Groups
          </button>
          
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Today's Rankings</h3>
            <Trophy className="w-4 h-4 text-yellow-500" />
          </div>

          {loading ? (
             <div className="text-center py-10"><p className="text-slate-500 text-sm animate-pulse">Calculating scores...</p></div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((member, index) => (
                <div key={member.id} className={`p-4 bg-[#161F32] border rounded-[24px] flex items-center gap-4 transition-all ${member.isMe ? 'border-cyan-500/50 bg-cyan-500/5 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'border-slate-800'}`}>
                  <div className="w-6 text-center font-black text-slate-500">{index + 1}</div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs border ${member.isMe ? 'bg-cyan-500 text-white border-cyan-400' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                    {member.initials}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1.5 items-end">
                      <span className="font-bold text-sm text-slate-100">{member.name} {member.isMe && <span className="text-[10px] text-cyan-400 ml-1">(You)</span>}</span>
                      <span className="text-[10px] text-slate-400 font-bold">{Math.round(member.percentage)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-1000 ease-out ${member.percentage >= 100 ? 'bg-green-400' : 'bg-cyan-500'}`} style={{ width: `${member.percentage}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}