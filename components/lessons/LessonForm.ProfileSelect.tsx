interface Profile {
  id: string;
  email: string;
  full_name: string | null;
}

interface Props {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Profile[];
  label: string;
  name: string;
  error?: string;
}

export function ProfileSelect({ value, onChange, options, label, name, error }: Props) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        {label} *
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required
        data-testid={`lesson-${name}`}
        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-300 bg-white rounded-lg shadow-sm transition-all duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white hover:border-gray-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg dark:hover:border-gray-500"
      >
        <option value="">Select a {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.full_name ?? option.email} ({option.email})
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
