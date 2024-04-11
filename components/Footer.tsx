import {
  FaDiscord,
  FaTwitter,
  FaMediumM,
  FaRedditAlien,
  FaGithub,
} from "react-icons/fa";
import { SiTelegram } from "react-icons/si";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="flex justify-between items-center mt-8 pb-8 leading-8 font-bold text-white">
      <div className="flex flex-col sm:flex-row sm:items-center">
        <span className="opacity-100">Adamant.fi ©2024</span>
        <span className="mx-4 opacity-50">–</span>
        <Link
          href="/privacy-policy"
          className="hover:underline opacity-50 hover:opacity-75 transition-all"
        >
          Privacy policy
        </Link>
        <Link
          href="/contact"
          className="ml-4 hover:underline opacity-50 hover:opacity-75 transition-all"
        >
          Contact
        </Link>
      </div>
      <div className="flex gap-4">
        {/* discord */}
        <Link
          href="https://discord.gg/knnDMcJ3Xe"
          className="opacity-50 hover:opacity-75 transition-all duration-150 pb-0.5"
        >
          <FaDiscord size={24} />
        </Link>
        {/* twitter */}
        <Link
          href="https://twitter.com/secret_swap"
          className="opacity-50 hover:opacity-75 transition-all duration-150"
        >
          <FaTwitter size={23} />
        </Link>
        {/* github */}
        <Link
          href="https://github.com/dredshep/AdamantFiSite"
          className="opacity-50 hover:opacity-75 transition-all duration-150 pt-px"
        >
          <FaGithub size={21} />
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
