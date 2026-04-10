"use client";

import { useState, useCallback, useEffect } from "react";
import {
  createProposal,
  vote,
  getProposal,
  getProposalCount,
  CONTRACT_ADDRESS,
} from "@/hooks/contract";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Spotlight } from "@/components/ui/spotlight";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Icons ────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function VoteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 12 2 2 4-4" />
      <path d="m5 10.2 1.9 1.9c.8.8 1.9 1.2 3.1 1.2h4c1.2 0 2.3-.4 3.1-1.2l1.9-1.9" />
      <path d="m16 5.8 1.9 1.9c.8.8 1.9 1.2 3.1 1.2h4c1.2 0 2.3-.4 3.1-1.2l1.9-1.9" />
      <path d="M8.2 7.8 5 5" />
      <path d="M14.4 14.4 12 12" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

// ── Styled Input ─────────────────────────────────────────────

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">
        {label}
      </label>
      <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#7c6cf0]/30 focus-within:shadow-[0_0_20px_rgba(124,108,240,0.08)]">
        <input
          {...props}
          className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/15 outline-none"
        />
      </div>
    </div>
  );
}

// ── Method Signature ─────────────────────────────────────────

function MethodSignature({
  name,
  params,
  returns,
  color,
}: {
  name: string;
  params: string;
  returns?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 font-mono text-sm">
      <span style={{ color }} className="font-semibold">fn</span>
      <span className="text-white/70">{name}</span>
      <span className="text-white/20 text-xs">{params}</span>
      {returns && (
        <span className="ml-auto text-white/15 text-[10px]">{returns}</span>
      )}
    </div>
  );
}

// ── Proposal Type ────────────────────────────────────────────

interface ProposalData {
  id: number;
  title: string;
  votes: number;
}

// ── Main Component ────────────────────────────────────────────

type Tab = "vote" | "create" | "list";

interface ContractUIProps {
  walletAddress: string | null;
  onConnect: () => void;
  isConnecting: boolean;
}

export default function ContractUI({ walletAddress, onConnect, isConnecting }: ContractUIProps) {
  const [activeTab, setActiveTab] = useState<Tab>("vote");
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Create proposal state
  const [newTitle, setNewTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Vote state
  const [voteId, setVoteId] = useState("");
  const [isVoting, setIsVoting] = useState(false);

  // List state
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Load proposals
  const loadProposals = useCallback(async () => {
    setIsLoadingProposals(true);
    try {
      const count = await getProposalCount();
      if (count && count > 0) {
        const loadedProposals: ProposalData[] = [];
        for (let i = 1; i <= count; i++) {
          const proposal = await getProposal(i);
          if (proposal) {
            loadedProposals.push({
              id: proposal.id,
              title: proposal.title,
              votes: proposal.votes,
            });
          }
        }
        setProposals(loadedProposals);
      } else {
        setProposals([]);
      }
    } catch (err) {
      console.error("Failed to load proposals:", err);
    } finally {
      setIsLoadingProposals(false);
    }
  }, []);

  // Load proposals when switching to list tab
  useEffect(() => {
    if (activeTab === "list") {
      loadProposals();
    }
  }, [activeTab, loadProposals]);

  const handleCreateProposal = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!newTitle.trim()) return setError("Enter a proposal title");
    setError(null);
    setIsCreating(true);
    setTxStatus("Awaiting signature...");
    try {
      await createProposal(walletAddress, newTitle.trim());
      setTxStatus("Proposal created on-chain!");
      setNewTitle("");
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsCreating(false);
    }
  }, [walletAddress, newTitle]);

  const handleVote = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    const proposalId = parseInt(voteId.trim(), 10);
    if (isNaN(proposalId) || proposalId < 1) return setError("Enter a valid proposal ID");
    setError(null);
    setIsVoting(true);
    setTxStatus("Awaiting signature...");
    try {
      await vote(walletAddress, proposalId);
      setTxStatus("Vote recorded on-chain!");
      setVoteId("");
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsVoting(false);
    }
  }, [walletAddress, voteId]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "vote", label: "Vote", icon: <VoteIcon />, color: "#34d399" },
    { key: "create", label: "Create", icon: <PlusIcon />, color: "#7c6cf0" },
    { key: "list", label: "Proposals", icon: <BarChartIcon />, color: "#4fc3f7" },
  ];

  return (
    <div className="w-full max-w-2xl animate-fade-in-up-delayed">
      {/* Toasts */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#f87171]/15 bg-[#f87171]/[0.05] px-4 py-3 backdrop-blur-sm animate-slide-down">
          <span className="mt-0.5 text-[#f87171]"><AlertIcon /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#f87171]/90">Error</p>
            <p className="text-xs text-[#f87171]/50 mt-0.5 break-all">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="shrink-0 text-[#f87171]/30 hover:text-[#f87171]/70 text-lg leading-none">&times;</button>
        </div>
      )}

      {txStatus && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#34d399]/15 bg-[#34d399]/[0.05] px-4 py-3 backdrop-blur-sm shadow-[0_0_30px_rgba(52,211,153,0.05)] animate-slide-down">
          <span className="text-[#34d399]">
            {txStatus.includes("on-chain") ? <CheckIcon /> : <SpinnerIcon />}
          </span>
          <span className="text-sm text-[#34d399]/90">{txStatus}</span>
        </div>
      )}

      {/* Main Card */}
      <Spotlight className="rounded-2xl">
        <AnimatedCard className="p-0" containerClassName="rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c6cf0]/20 to-[#34d399]/20 border border-white/[0.06]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#7c6cf0]">
                  <path d="m9 12 2 2 4-4" />
                  <path d="m5 10.2 1.9 1.9c.8.8 1.9 1.2 3.1 1.2h4c1.2 0 2.3-.4 3.1-1.2l1.9-1.9" />
                  <path d="m16 5.8 1.9 1.9c.8.8 1.9 1.2 3.1 1.2h4c1.2 0 2.3-.4 3.1-1.2l1.9-1.9" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/90">Voting DApp</h3>
                <p className="text-[10px] text-white/25 font-mono mt-0.5">{truncate(CONTRACT_ADDRESS)}</p>
              </div>
            </div>
            <Badge variant="success" className="text-[10px]">Soroban</Badge>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] px-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setError(null); }}
                className={cn(
                  "relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all",
                  activeTab === t.key ? "text-white/90" : "text-white/35 hover:text-white/55"
                )}
              >
                <span style={activeTab === t.key ? { color: t.color } : undefined}>{t.icon}</span>
                {t.label}
                {activeTab === t.key && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full transition-all"
                    style={{ background: `linear-gradient(to right, ${t.color}, ${t.color}66)` }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Vote */}
            {activeTab === "vote" && (
              <div className="space-y-5">
                <MethodSignature name="vote" params="(proposal_id: u32, voter: Address)" color="#34d399" />
                <Input 
                  label="Proposal ID" 
                  value={voteId} 
                  onChange={(e) => setVoteId(e.target.value)} 
                  placeholder="Enter proposal ID (e.g. 1)" 
                  type="number"
                />
                {walletAddress ? (
                  <ShimmerButton onClick={handleVote} disabled={isVoting} shimmerColor="#34d399" className="w-full">
                    {isVoting ? <><SpinnerIcon /> Voting...</> : <><VoteIcon /> Cast Vote</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#34d399]/20 bg-[#34d399]/[0.03] py-4 text-sm text-[#34d399]/60 hover:border-[#34d399]/30 hover:text-[#34d399]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to vote
                  </button>
                )}
              </div>
            )}

            {/* Create */}
            {activeTab === "create" && (
              <div className="space-y-5">
                <MethodSignature name="create_proposal" params="(title: Symbol)" returns="-> u32" color="#7c6cf0" />
                <Input 
                  label="Proposal Title" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)} 
                  placeholder="Enter proposal title" 
                />
                {walletAddress ? (
                  <ShimmerButton onClick={handleCreateProposal} disabled={isCreating} shimmerColor="#7c6cf0" className="w-full">
                    {isCreating ? <><SpinnerIcon /> Creating...</> : <><PlusIcon /> Create Proposal</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#7c6cf0]/20 bg-[#7c6cf0]/[0.03] py-4 text-sm text-[#7c6cf0]/60 hover:border-[#7c6cf0]/30 hover:text-[#7c6cf0]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to create proposal
                  </button>
                )}
              </div>
            )}

            {/* List */}
            {activeTab === "list" && (
              <div className="space-y-5">
                <MethodSignature name="get_proposal" params="(proposal_id: u32)" returns="-> Proposal" color="#4fc3f7" />
                
                {isLoadingProposals ? (
                  <div className="flex items-center justify-center py-8">
                    <SpinnerIcon />
                    <span className="ml-2 text-sm text-white/40">Loading proposals...</span>
                  </div>
                ) : proposals.length === 0 ? (
                  <div className="text-center py-8 text-white/30 text-sm">
                    No proposals yet. Create one to get started!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {proposals.map((proposal) => (
                      <div 
                        key={proposal.id}
                        className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden animate-fade-in-up"
                      >
                        <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.04]">
                          <div className="flex items-center gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#7c6cf0]/20 text-[10px] font-bold text-[#7c6cf0]">
                              {proposal.id}
                            </span>
                            <span className="font-medium text-white/80">{proposal.title}</span>
                          </div>
                          <Badge variant="success">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#34d399] mr-1.5" />
                            {proposal.votes} votes
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <ShimmerButton onClick={loadProposals} shimmerColor="#4fc3f7" className="w-full">
                  <BarChartIcon /> Refresh Proposals
                </ShimmerButton>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.04] px-6 py-3 flex items-center justify-between">
            <p className="text-[10px] text-white/15">Voting DApp &middot; Soroban</p>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#34d399]" />
                <span className="font-mono text-[9px] text-white/15">1 vote per wallet</span>
              </span>
            </div>
          </div>
        </AnimatedCard>
      </Spotlight>
    </div>
  );
}