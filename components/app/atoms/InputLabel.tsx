export default function InputLabel({ label }: { label: string }) {
  return (
    <label className="block text-sm leading-6 font-medium text-white text-[13px] uppercase">
      {label}
    </label>
  );
}
