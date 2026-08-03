import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, Send, ArrowLeft, Search } from "lucide-react";
import { db, getMessageContacts } from "../lib/db";
import { useAuth } from "../context/AuthContext";
import { initials } from "../lib/bloodUtils";

const AVATAR_COLORS = [
  "bg-crimson-600", "bg-amber-500", "bg-teal-600", "bg-crimson-800",
  "bg-indigo-500", "bg-crimson-500", "bg-emerald-600", "bg-crimson-950",
];

function avatarColor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export default function Messages() {
  const { user } = useAuth();
  const location = useLocation();
  const contacts = getMessageContacts(user.id);
  const [activeId, setActiveId] = useState(location.state?.withId || null);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [, forceRerender] = useState(0);

  useEffect(() => {
    if (location.state?.withId) setActiveId(location.state.withId);
  }, [location.state]);

  const allMessages = useMemo(() => db.messages.list(), [forceRerender]); // eslint-disable-line react-hooks/exhaustive-deps

  const contactsWithPreview = useMemo(() => {
    const withPreview = contacts.map((c) => {
      const thread = allMessages
        .filter((m) => m.threadId === c.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const last = thread[0];
      return {
        ...c,
        lastMessage: last ? last.body : c.subtitle,
        lastAt: last ? last.createdAt : null,
      };
    });
    return withPreview.sort((a, b) => {
      if (!a.lastAt && !b.lastAt) return a.name.localeCompare(b.name);
      if (!a.lastAt) return 1;
      if (!b.lastAt) return -1;
      return new Date(b.lastAt) - new Date(a.lastAt);
    });
  }, [contacts, allMessages]);

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contactsWithPreview;
    return contactsWithPreview.filter((c) => c.name.toLowerCase().includes(q));
  }, [contactsWithPreview, search]);

  const active = contactsWithPreview.find((c) => c.id === activeId);

  const thread = useMemo(() => {
    if (!activeId) return [];
    return allMessages
      .filter((m) => m.threadId === activeId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [activeId, allMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!draft.trim() || !activeId) return;
    db.messages.create({
      threadId: activeId,
      senderId: user.id,
      senderName: user.fullName,
      body: draft.trim(),
    });
    setDraft("");
    forceRerender((n) => n + 1);
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-crimson-950 mb-6">Messages</h1>
      <div className="bg-white rounded-2xl border border-crimson-100 overflow-hidden flex h-[calc(100vh-220px)] min-h-[420px]">
        <div className={`w-full sm:w-80 shrink-0 border-r border-crimson-100 flex flex-col ${active ? "hidden sm:flex" : "flex"}`}>
          <div className="p-3 border-b border-crimson-50">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-crimson-900/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-crimson-50/70 text-sm text-crimson-950 placeholder:text-crimson-900/30 focus-ring"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.length === 0 && (
              <p className="text-sm text-crimson-900/40 text-center py-10 px-4">
                {search ? "No contacts match your search." : "No one to message yet. Contacts appear here once you view a donor or a blood request."}
              </p>
            )}
            {filteredContacts.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-crimson-50 transition-colors ${
                  activeId === c.id ? "bg-crimson-50" : "hover:bg-crimson-50/50"
                }`}
              >
                <div className={`w-10 h-10 rounded-full ${avatarColor(c.id)} text-white text-xs font-bold flex items-center justify-center shrink-0`}>
                  {initials(c.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-crimson-950 truncate">{c.name}</p>
                    {c.lastAt && <span className="text-[11px] text-crimson-900/35 shrink-0">{formatTime(c.lastAt)}</span>}
                  </div>
                  <p className="text-xs text-crimson-900/45 truncate mt-0.5">{c.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className={`flex-1 flex-col ${active ? "flex" : "hidden sm:flex"}`}>
          {active ? (
            <>
              <div className="px-5 py-4 border-b border-crimson-100 flex items-center gap-3">
                <button
                  className="sm:hidden p-1.5 -ml-1 rounded-lg hover:bg-crimson-50 text-crimson-700"
                  onClick={() => setActiveId(null)}
                >
                  <ArrowLeft size={16} />
                </button>
                <div className={`w-9 h-9 rounded-full ${avatarColor(active.id)} text-white text-xs font-bold flex items-center justify-center`}>
                  {initials(active.name)}
                </div>
                <div>
                  <p className="font-semibold text-crimson-950 text-sm">{active.name}</p>
                  <p className="text-xs text-crimson-900/40">{active.subtitle}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-sand/40">
                {thread.length === 0 && (
                  <p className="text-center text-sm text-crimson-900/40 mt-10">
                    Say hello to start the conversation.
                  </p>
                )}
                {thread.map((m, i) => {
                  const mine = m.senderId === user.id;
                  const prev = thread[i - 1];
                  const showTime = !prev || new Date(m.createdAt) - new Date(prev.createdAt) > 5 * 60 * 1000;
                  return (
                    <div key={m.id}>
                      {showTime && (
                        <p className="text-center text-[11px] text-crimson-900/35 mb-2">{formatTime(m.createdAt)}</p>
                      )}
                      <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                        {!mine && (
                          <div className={`w-6 h-6 rounded-full ${avatarColor(active.id)} text-white text-[10px] font-bold flex items-center justify-center shrink-0`}>
                            {initials(active.name)}
                          </div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                            mine
                              ? "gradient-brand text-white rounded-br-sm"
                              : "bg-white border border-crimson-100 text-crimson-950 rounded-bl-sm"
                          }`}
                        >
                          {m.body}
                        </motion.div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={handleSend} className="p-4 border-t border-crimson-100 flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
                />
                <button
                  type="submit"
                  className="w-10 h-10 rounded-xl gradient-brand text-white flex items-center justify-center hover:opacity-90 transition-opacity shrink-0"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-crimson-900/30">
              <MessageSquare size={40} />
              <p className="mt-3 text-sm">Select a conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
