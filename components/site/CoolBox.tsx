import Image from "next/image";
import cn from "classnames";
import Link from "next/link";

type CoolBoxProps = {
  icon: string;
  secondaryText: string;
  buttonText: string;
  link: string;
  type: "light" | "dark";
};

interface CoolBoxWithText extends CoolBoxProps {
  mainText: string;
  alt?: never;
}

interface CoolBoxWithJSX extends CoolBoxProps {
  mainText: JSX.Element;
  alt: string;
}

function CoolBox(props: CoolBoxWithText): JSX.Element;
function CoolBox(props: CoolBoxWithJSX): JSX.Element;
function CoolBox({
  icon,
  mainText,
  secondaryText,
  buttonText,
  link,
  type,
  alt,
}: CoolBoxWithText | CoolBoxWithJSX) {
  return (
    <div className="bg-[#0C0C20] rounded-2xl h-[340px] flex-1">
      <div
        className={cn(
          {
            "bg-opacity-10": type === "dark",
            "bg-opacity-15": type === "light",
          },
          "bg-white  rounded-2xl flex flex-col justify-between items-center"
        )}
      >
        <Image
          src={icon}
          width={75}
          height={75}
          alt={typeof mainText === "string" ? mainText : alt!}
          className="mt-11 max-h-[65px] max-w-[90px] invert opacity-55 p-2 "
        />

        <h1 className="text-2xl font-bold px-10 text-center leading-10 mt-7">
          {mainText}
        </h1>
        <div className="text-lg flex-grow leading-8 mt-1 mb-10">
          {secondaryText}
        </div>
        <Link
          href={link}
          className={cn(
            {
              "bg-adamant-box-buttonDark": type === "dark",
              "bg-adamant-box-buttonLight": type === "light",
            },
            "px-4 py-2 rounded-b-2xl text-base font-bold self-stretch text-center leading-8 text-adamant-accentText"
          )}
        >
          {buttonText}
        </Link>
      </div>
    </div>
  );
}

export default CoolBox;
