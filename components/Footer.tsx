import { FaDiscord, FaTwitter, FaMediumM, FaRedditAlien } from "react-icons/fa";
import { SiTelegram } from "react-icons/si";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="flex justify-between items-center mt-8 pb-8 leading-8 font-bold text-white">
      <div className="flex flex-col sm:flex-row sm:items-center">
        <span className="opacity-100">Adamant.fi ©2024</span>
        <span className="mx-4 opacity-50">–</span>
        <Link href="/privacy-policy" className="hover:underline opacity-50">
          Privacy policy
        </Link>
        <Link href="/contact" className="ml-4 hover:underline opacity-50">
          Contact
        </Link>
      </div>
      <div className="flex opacity-50">
        <Link href="https://discord.gg/knnDMcJ3Xe" className="mr-4">
          <FaDiscord size={24} />
        </Link>
        <Link href="https://twitter.com/secret_swap" className="mr-4">
          <FaTwitter size={24} />
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
