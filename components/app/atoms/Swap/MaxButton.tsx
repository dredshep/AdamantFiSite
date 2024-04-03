const MaxButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      className="bg-adamant-app-input text-sm font-bold text-white px-4"
      onClick={onClick}
    >
      MAX
    </button>
  );
};
export default MaxButton;
