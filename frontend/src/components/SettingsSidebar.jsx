function SettingsSidebar({ activeCategory, onCategoryChange }) {
  const categories = [
    { id: 'gmail-sync', label: 'Gmail & Sync', enabled: true },
    { id: 'profile', label: 'Profile', enabled: false },
    { id: 'appearance', label: 'Appearance', enabled: false },
    { id: 'notifications', label: 'Notifications', enabled: false },
    { id: 'data-privacy', label: 'Data & Privacy', enabled: false },
  ];

  return (
    <div className="w-48 border-r border-border p-4">
      <nav className="space-y-1">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => category.enabled && onCategoryChange(category.id)}
            disabled={!category.enabled}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeCategory === category.id
                ? 'bg-accent/10 text-accent'
                : category.enabled
                ? 'text-text hover:bg-gray-100'
                : 'text-text-light cursor-not-allowed'
            }`}
            title={category.enabled ? undefined : 'Coming soon'}
          >
            {category.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default SettingsSidebar;