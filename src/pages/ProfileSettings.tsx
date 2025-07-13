import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const LOCAL_KEY = "profile_settings";

// Use DiceBear's 'adventurer' style for cute animated avatars
const getRandomAvatar = () => {
  const seed = Math.random().toString(36).substring(2, 12);
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
};

const ProfileSettings = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [password, setPassword] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [formError, setFormError] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem(LOCAL_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      setName(parsed.name || "");
      setEmail(parsed.email || "");
      setAvatar(parsed.avatar || "");
    } else {
      setName("John Doe");
      setEmail("john@example.com");
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!name.trim() || !email.trim()) {
      setFormError("Name and Email are required.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    const profile = { name, email, avatar };
    localStorage.setItem(LOCAL_KEY, JSON.stringify(profile));
    // TODO: Send to backend API if needed
    setTimeout(() => {
      setSaved(true);
      setLoading(false);
      setTimeout(() => {
        setSaved(false);
        navigate("/");
      }, 1200);
    }, 1000);
  };

  const handleRandomAvatar = () => {
    setAvatarError(false);
    const newAvatar = getRandomAvatar();
    setAvatar(newAvatar);
    if (avatarInputRef.current) avatarInputRef.current.value = newAvatar;
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError(false);
    setAvatar(e.target.value);
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-8 fade-in">
      <h2 className="text-3xl font-extrabold mb-6 text-center gradient-text">Profile Settings</h2>
      <form onSubmit={handleSave} className="space-y-5">
        <div className="flex flex-col items-center mb-2">
          <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shadow relative">
            {avatar && !avatarError ? (
              <img src={avatar} alt="avatar" className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
            ) : (
              <span className="text-3xl text-slate-400">👤</span>
            )}
            {avatarError && (
              <span className="absolute inset-0 flex items-center justify-center text-xs text-red-500 bg-white/80 dark:bg-slate-900/80">Invalid URL</span>
            )}
          </div>
          <button type="button" className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition" onClick={handleRandomAvatar} title="Generate a random cute avatar">Random Avatar</button>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            className="w-full border rounded px-3 py-2 bg-slate-50 dark:bg-slate-800"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            className="w-full border rounded px-3 py-2 bg-slate-50 dark:bg-slate-800"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 flex items-center gap-1">
            Avatar URL
            <span className="text-xs text-gray-400" title="Paste a direct image link or use 'Random Avatar'">?</span>
          </label>
          <input
            className="w-full border rounded px-3 py-2 bg-slate-50 dark:bg-slate-800"
            value={avatar}
            onChange={handleAvatarChange}
            placeholder="https://..."
            ref={avatarInputRef}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password <span className="text-xs text-gray-400">(optional)</span></label>
          <input
            className="w-full border rounded px-3 py-2 bg-slate-50 dark:bg-slate-800"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold transition disabled:opacity-60" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
        {formError && <div className="text-red-600 text-center mt-2">{formError}</div>}
        {saved && <div className="text-green-600 text-center mt-2">Profile saved! Redirecting...</div>}
      </form>
    </div>
  );
};

export default ProfileSettings; 