'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Plus, Radio, Users, Lock, Sparkles, Flame } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { RoomSummary } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  REGIONS,
  RegionCategory,
  getRegionForRoom,
  getStateFamousWords
} from '@/lib/constants';
import { JunctionCardSkeleton } from '@/components/ui/skeleton';
import { AvatarGroup } from '@/components/ui/AvatarGroup';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function JunctionsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [query, setQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<RegionCategory>('all');
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRooms() {
      try {
        const data = await apiClient<RoomSummary[]>('/api/rooms');
        setRooms(data);
      } catch (err) {
        console.error('Failed to load rooms:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRooms();
    const interval = setInterval(loadRooms, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleCloseCreateModal = (open: boolean) => {
    setCreateModalOpen(open);
    if (!open) {
      setNewTopic('');
      setNewPassword('');
      setCreateError(null);
      setIsCreating(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim() || !newPassword.trim()) {
      setCreateError('Topic and password are required');
      return;
    }

    if (newTopic.trim().length > 20) {
      setCreateError('Room topic must be 20 characters or less');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await apiClient<{ success: boolean; roomId: string }>('/api/rooms/create-room', {
        method: 'POST',
        body: JSON.stringify({
          topic: newTopic.trim(),
          password: newPassword.trim()
        })
      });

      if (res.success && res.roomId) {
        const trimmedPwd = newPassword.trim();
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem(`room_pwd_${res.roomId}`, trimmedPwd);
          } catch (e) {}
        }
        handleCloseCreateModal(false);
        router.push(`/room/${res.roomId}?pwd=${encodeURIComponent(trimmedPwd)}`);
      }
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create room');
    } finally {
      setIsCreating(false);
    }
  };

  // Live rooms with active speakers matching the current tab
  const currentLiveRooms = rooms.filter((r) => {
    if (r.activeMembersCount <= 0) return false;
    if (selectedRegion === 'all') return true;
    return getRegionForRoom(r.id, r.isCustom) === selectedRegion;
  });

  // Filtered rooms based on Search query & selected Region tab
  const filtered = rooms
    .filter((r) => {
      const matchesQuery = r.name.toLowerCase().includes(query.toLowerCase());
      if (!matchesQuery) return false;
      if (selectedRegion === 'all') return true;
      return getRegionForRoom(r.id, r.isCustom) === selectedRegion;
    })
    .sort((a, b) => b.activeMembersCount - a.activeMembersCount || b.totalListeners - a.totalListeners);

  // Exclude rooms already featured in the Live section to eliminate bad duplicate UX
  const directoryRooms = (currentLiveRooms.length > 0 && query.trim() === '')
    ? filtered.filter((r) => !currentLiveRooms.some((lr) => lr.id === r.id))
    : filtered;

  // Consistent, pixel-perfect card renderer
  const renderJunctionCard = (room: RoomSummary, isLiveHighlight = false) => {
    const famousWords = getStateFamousWords(room.id || room.name);
    const isLive = room.activeMembersCount > 0;

    return (
      <Link
        key={room.id}
        href={`/room/${room.id}`}
        className={cn(
          'p-3.5 sm:p-4 rounded-brutal-md border-2 bg-card transition-all group flex flex-col justify-between h-[142px] min-w-0 overflow-hidden',
          isLive || isLiveHighlight
            ? 'border-amber-400/60 shadow-[3px_3px_0px_rgba(251,191,36,0.35)] hover:border-amber-400 hover:shadow-[4px_4px_0px_rgba(251,191,36,0.55)] bg-card opacity-100 ring-1 ring-amber-400/20'
            : 'border-primary/25 shadow-brutal-dark-sm hover:border-primary hover:shadow-brutal opacity-80 hover:opacity-100'
        )}
      >
        <div className="space-y-2.5">
          {/* Top Row: Type Badge on Left, State Name on Top Right in consistent font */}
          <div className="flex items-center justify-between gap-2 h-6 min-w-0">
            <Badge
              variant={isLive || isLiveHighlight ? 'gold' : room.isCustom ? 'secondary' : 'default'}
              className={cn(
                'text-[9px] sm:text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 shrink-0 transition-opacity',
                !isLive && !isLiveHighlight && 'opacity-85 group-hover:opacity-100'
              )}
            >
              {isLive ? 'LIVE STAGE' : room.isCustom ? 'CUSTOM DEBATE' : 'STATE JUNCTION'}
            </Badge>

            <div className="flex items-center gap-1.5 min-w-0 justify-end flex-1">
              {room.hasPassword && (
                <span title="Password Protected" className="text-muted-foreground shrink-0">
                  <Lock className="h-3 w-3" />
                </span>
              )}
              <h3
                title={room.name}
                className="font-mono font-extrabold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors truncate text-right tracking-tight max-w-[130px] sm:max-w-[155px]"
              >
                {room.name}
              </h3>
            </div>
          </div>

          {/* 3 Famous Cultural Highlights of the State - Strictly One Row */}
          <div className="h-6 flex items-center">
            <div className="grid grid-cols-3 gap-1.5 w-full items-center">
              {famousWords.map((word, idx) => (
                <span
                  key={idx}
                  title={word}
                  className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-medium bg-primary/10 border border-primary/25 text-foreground/90 group-hover:border-primary/50 group-hover:bg-primary/20 transition-all shadow-xs min-w-0"
                >
                  <span className="w-1 h-1 rounded-full bg-primary/80 shrink-0" />
                  <span className="truncate">{word}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row: Room count on Left, Avatars & LIVE Pill on Right Below */}
        <div className="pt-2.5 border-t border-border/60 flex items-center justify-between h-7 text-xs font-mono gap-2 mt-auto">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono shrink-0">
            <Users className="h-3.5 w-3.5 text-primary" />
            {room.totalListeners} in room
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            <AvatarGroup
              users={room.allUsers || []}
              totalCount={room.totalListeners}
              maxDisplay={3}
              size="xs"
              showSingleName={false}
            />

            {room.activeMembersCount > 0 ? (
              <span className="flex items-center gap-1 font-bold text-amber-300 bg-amber-400/20 border border-amber-400/50 px-2 py-0.5 rounded-full text-[10px] shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                {room.activeMembersCount} LIVE
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground font-mono bg-secondary px-1.5 py-0.5 rounded border border-border">
                0 live
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  };

  // Dedicated "Create Custom Room" card (Displayed ONLY in Custom Tab)
  const renderCreateCustomCard = () => {
    return (
      <div
        key="create-custom-room-card"
        onClick={() => setCreateModalOpen(true)}
        className="p-3.5 sm:p-4 rounded-brutal-md border-2 border-dashed border-primary/60 bg-primary/5 hover:bg-primary/10 hover:border-primary shadow-brutal-dark-sm hover:shadow-brutal transition-all cursor-pointer flex flex-col justify-between h-[142px] min-w-0 overflow-hidden group"
      >
        <div className="space-y-2.5">
          {/* Top Row: Type Badge on Left, Action on Right */}
          <div className="flex items-center justify-between gap-2 h-6 min-w-0">
            <Badge
              variant="default"
              className="text-[9px] sm:text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 shrink-0 bg-primary text-primary-foreground"
            >
              + NEW JUNCTION
            </Badge>

            <span className="font-mono text-xs font-bold text-primary flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition-transform">
              Host Debate <Plus className="h-3.5 w-3.5 group-hover:rotate-90 transition-transform" />
            </span>
          </div>

          {/* Middle Row: 3 Concise Highlights - Never Truncates */}
          <div className="h-6 flex items-center">
            <div className="grid grid-cols-3 gap-1.5 w-full items-center">
              {['Passcode', 'Topic', 'WebRTC'].map((tag, idx) => (
                <span
                  key={idx}
                  title={tag}
                  className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-medium bg-primary/15 border border-primary/30 text-foreground/90 group-hover:border-primary/50 group-hover:bg-primary/25 transition-all shadow-xs min-w-0"
                >
                  <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                  <span className="truncate">{tag}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row: Action button */}
        <div className="pt-2 border-t border-border/60 flex items-center justify-between h-7 text-xs font-mono gap-2 mt-auto">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setCreateModalOpen(true);
            }}
            className="w-full h-7 text-xs font-mono font-bold gap-1.5 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Create Custom Room
          </Button>
        </div>
      </div>
    );
  };

  // Keep create room card ONLY in the custom tab as requested
  const showCreateCard = selectedRegion === 'custom';

  return (
    <div className="h-[calc(100dvh-4rem)] flex flex-col overflow-hidden max-w-7xl mx-auto px-4">
      {/* FIXED TOP SECTION (Pinned at top, does not scroll) */}
      <div className="shrink-0 pt-3 pb-3 space-y-3 border-b-2 border-border/80 bg-background/95 backdrop-blur-sm z-20">
        {/* Desktop Header Row: Title & Create Room Button (hidden on mobile for sleek app feel) */}
        <div className="hidden sm:flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black font-mono uppercase tracking-tight text-foreground">
              State Voice Junctions
            </h1>
            <p className="text-xs text-muted-foreground font-sans mt-0.5">
              Browse all State & UT voice rooms or spin up a temporary custom debate room.
            </p>
          </div>

          <Button onClick={() => setCreateModalOpen(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Create Custom Room
          </Button>
        </div>

        {/* Filter Controls Row: Shadcn Tabs & Search Bar (Fixed on both Mobile & Desktop) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Shadcn Tabs for Filter: All, Custom, North, South, West, East, Central, North East */}
          <Tabs
            value={selectedRegion}
            onValueChange={(val) => setSelectedRegion(val as RegionCategory)}
            className="w-full sm:w-auto"
          >
            <TabsList className="w-full sm:w-auto overflow-x-auto justify-start flex-nowrap scrollbar-none">
              {REGIONS.map((region) => {
                const hasLive = rooms.some((r) => {
                  if (r.activeMembersCount <= 0) return false;
                  if (region.id === 'all') return true;
                  return getRegionForRoom(r.id, r.isCustom) === region.id;
                });

                const isCustom = region.id === 'custom';

                return (
                  <TabsTrigger
                    key={region.id}
                    value={region.id}
                    className={cn(
                      'flex items-center gap-1.5 text-xs font-mono transition-all',
                      isCustom &&
                        'text-amber-400 bg-amber-400/10 border border-amber-400/40 font-semibold hover:bg-amber-400/20 hover:text-amber-300 hover:border-amber-400/70 data-[state=active]:bg-amber-400 data-[state=active]:text-black data-[state=active]:border-amber-400 data-[state=active]:font-extrabold data-[state=active]:shadow-sm'
                    )}
                  >
                    <span>{region.label}</span>
                    {hasLive && (
                      <span className="relative flex h-1.5 w-1.5 ml-0.5">
                        <span
                          className={cn(
                            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                            isCustom && selectedRegion === 'custom' ? 'bg-black' : 'bg-amber-400'
                          )}
                        />
                        <span
                          className={cn(
                            'relative inline-flex rounded-full h-1.5 w-1.5',
                            isCustom && selectedRegion === 'custom' ? 'bg-black' : 'bg-amber-400'
                          )}
                        />
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          {/* Search Bar + Mobile Quick Action */}
          <div className="flex items-center gap-2 w-full sm:w-72 lg:w-80">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search state..."
                className="pl-9 h-9 text-xs bg-card"
              />
            </div>
            <Button
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="sm:hidden h-9 px-2.5 gap-1 shrink-0 font-mono text-xs"
              title="Create Custom Room"
            >
              <Plus className="h-4 w-4" />
              <span>Room</span>
            </Button>
          </div>
        </div>
      </div>

      {/* SCROLLABLE JUNCTIONS SECTION (Only this part scrolls) */}
      <div className="flex-1 overflow-y-auto py-5 pr-1 space-y-6 scrollbar-thin">
        {/* Live Now Stations - Short, sleek, compact light yellow styling */}
        {!loading && currentLiveRooms.length > 0 && query.trim() === '' && (
          <section className="space-y-2.5 p-3 sm:p-3.5 rounded-brutal-md border border-amber-400/30 bg-amber-400/[0.03] transition-all">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
              </span>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-300/90">
                Live Now
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentLiveRooms.map((room) => renderJunctionCard(room, true))}
            </div>
          </section>
        )}

        {/* Junctions Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <JunctionCardSkeleton key={idx} />
            ))}
          </div>
        ) : filtered.length === 0 && !showCreateCard ? (
          <div className="p-8 sm:p-14 text-center font-mono border-2 border-dashed border-border rounded-brutal-md flex flex-col items-center justify-center gap-4 bg-card/40 my-4">
            <div className="space-y-1">
              <p className="text-sm sm:text-base font-bold text-foreground">
                No junctions found for &quot;{query}&quot; in{' '}
                {REGIONS.find((r) => r.id === selectedRegion)?.label || selectedRegion}
              </p>
              <p className="text-xs text-muted-foreground max-w-md">
                Try searching for another state name or create your own custom debate room.
              </p>
            </div>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="gap-2 shadow-brutal-sm mt-1"
            >
              <Plus className="h-4 w-4" /> Create Custom Room
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {showCreateCard && renderCreateCustomCard()}
            {directoryRooms.map((room) => renderJunctionCard(room, false))}
          </div>
        )}

        {/* Subtle Footer at the end of scrollable content */}
        <footer className="pt-8 pb-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-muted-foreground">
          <span>Talk · 100% Anonymous WebRTC Voice Rooms.</span>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-primary transition-colors">About</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="/admin" className="hover:text-primary transition-colors">Admin</Link>
          </div>
        </footer>
      </div>

      {/* Create Custom Room Dialog */}
      <Dialog open={createModalOpen} onOpenChange={handleCloseCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Room</DialogTitle>
            <DialogDescription>
              Spin up a temporary password-protected debate junction. Automatically deleted when empty for 5 minutes.
            </DialogDescription>
          </DialogHeader>

          {createError && (
            <div className="p-2 text-xs text-destructive bg-destructive/10 border border-destructive rounded-brutal-sm font-mono">
              {createError}
            </div>
          )}

          <form onSubmit={handleCreateRoom} className="space-y-4 pt-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-mono font-bold text-muted-foreground uppercase">
                  Room Topic (Max 20 chars)
                </label>
                <span
                  className={cn(
                    'text-[10px] font-mono',
                    newTopic.length >= 20 ? 'text-amber-400 font-bold' : 'text-muted-foreground'
                  )}
                >
                  {newTopic.length}/20 chars
                </span>
              </div>
              <Input
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="e.g. AI & Tech Debate"
                maxLength={20}
                required
              />
              <p className="text-[10px] text-muted-foreground font-mono mt-1">
                Fixed 20-character limit preserves clean junction card display.
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-muted-foreground mb-1 uppercase">
                Room Password
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Required for participants to join"
                maxLength={50}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleCloseCreateModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create & Enter'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
