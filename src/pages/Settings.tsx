import React, { useEffect, useState } from "react";

const LOCAL_KEY = "app_settings";

const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "auto", label: "Auto" },
];

const colorOptions = [
  { value: "default", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "orange", label: "Orange" },
];

const Settings = () => {
  const [theme, setTheme] = useState("auto");
  const [color, setColor] = useState("default");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem(LOCAL_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      setTheme(parsed.theme || "auto");
      setColor(parsed.color || "default");
      setEmailNotifications(parsed.emailNotifications !== false);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ theme, color, emailNotifications }));
    setSaved(true);
    // Apply theme and color immediately
    const root = document.documentElement;
    if (theme === "dark" || (theme === "auto" && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    if (color === "default") {
      root.style.setProperty("--primary", "222.2 47.4% 11.2%");
      root.style.setProperty("--primary-foreground", "210 40% 98%");
      root.style.setProperty("--secondary", "210 40% 96.1%");
      root.style.setProperty("--secondary-foreground", "222.2 47.4% 11.2%");
    } else if (color === "green") {
      root.style.setProperty("--primary", "158 64% 38%");
      root.style.setProperty("--primary-foreground", "210 40% 98%");
      root.style.setProperty("--secondary", "174 60% 90%");
      root.style.setProperty("--secondary-foreground", "158 64% 38%");
    } else if (color === "orange") {
      root.style.setProperty("--primary", "24 94% 50%");
      root.style.setProperty("--primary-foreground", "210 40% 98%");
      root.style.setProperty("--secondary", "340 82% 90%");
      root.style.setProperty("--secondary-foreground", "24 94% 50%");
    }
    setTimeout(() => setSaved(false), 1200);
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-8 fade-in">
      <h2 className="text-3xl font-extrabold mb-6 text-center gradient-text">Settings</h2>
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Theme</label>
          <select
            className="w-full border rounded px-3 py-2 bg-slate-50 dark:bg-slate-800"
            value={theme}
            onChange={e => setTheme(e.target.value)}
          >
            {themeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Primary Color</label>
          <select
            className="w-full border rounded px-3 py-2 bg-slate-50 dark:bg-slate-800"
            value={color}
            onChange={e => setColor(e.target.value)}
          >
            {colorOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="emailNotifications"
            type="checkbox"
            checked={emailNotifications}
            onChange={e => setEmailNotifications(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="emailNotifications" className="text-sm font-medium">Enable Email Notifications</label>
        </div>
        <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold transition disabled:opacity-60">
          Save Settings
        </button>
        {saved && <div className="text-green-600 text-center mt-2">Settings saved!</div>}
      </form>
    </div>
  );
};

export default Settings; 