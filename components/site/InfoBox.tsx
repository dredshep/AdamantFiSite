import cn from "classnames";
import Link from "next/link";

type InfoBoxProps = {
  title: string;
  description: string;
  buttonText: string;
  link: string;
};

function InfoBox({
  title,
  description,
  buttonText,
  link,
}: InfoBoxProps): JSX.Element {
  return (
    <div
      className={cn(
        "border-opacity-50 border rounded-2xl flex flex-col justify-between p-6 sm:p-8 flex-1",
        "text-white border-adamant-box-border border-2", // adjust your width and border color here
        "min-w-80"
      )}
    >
      <h1 className="text-2xl font-bold leading-8">{title}</h1>
      <div className="text-lg opacity-50 leading-8 mt-2 font-bold">
        {description}
      </div>
      <Link
        href={link}
        className={cn(
          "bg-opacity-10 mt-4 rounded-md text-base font-bold text-adamant-accentText leading-8",
          "hover:bg-opacity-20" // Use the same color for consistency
        )}
      >
        {buttonText}
      </Link>
    </div>
  );
}

export default InfoBox;
