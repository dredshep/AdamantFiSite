import cn from "classnames";

interface SwapButtonProps {
  disabled?: boolean;
  onClick?: () => void;
}

const SwapButton: React.FC<SwapButtonProps> = ({
  disabled = false,
  onClick,
}) => {
  return (
    <button
      className={cn({
        "bg-adamant-accentBg hover:brightness-125 transition-all hover:saturate-150 active:saturate-200 active:brightness-150":
          !disabled,
        "bg-adamant-app-buttonDisabled": disabled,
        "text-lg rounded-b-xl text-black py-3 font-bold w-full": true,
      })}
      disabled={disabled}
      onClick={onClick}
    >
      SWAP
    </button>
  );
};
export default SwapButton;
