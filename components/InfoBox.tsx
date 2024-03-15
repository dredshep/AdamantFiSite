import cn from "classnames";

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
        "border-opacity-50 border rounded-2xl flex flex-col justify-between py-8 px-8 flex-1",
        "text-white border-adamant-box-border border-2" // adjust your width and border color here
      )}
    >
      <h1 className="text-2xl font-bold leading-8">{title}</h1>
      <p className="text-lg opacity-50 leading-8 mt-2 font-bold">
        {description}
      </p>
      <a
        href={link}
        className={cn(
          "bg-opacity-10 mt-4 rounded-md text-base font-bold text-adamant-accentText leading-8",
          "hover:bg-opacity-20" // Use the same color for consistency
        )}
      >
        {buttonText}
      </a>
    </div>
  );
}

export default InfoBox;
