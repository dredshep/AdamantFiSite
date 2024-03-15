import { FaDiscord, FaTwitter, FaMediumM, FaRedditAlien } from "react-icons/fa";
import { SiTelegram } from "react-icons/si";

const Footer = () => {
  return (
    <footer className="flex justify-between items-center my-8 leading-8 font-bold text-white">
      <div className="flex flex-col sm:flex-row sm:items-center">
        <span className="opacity-100">Adamant.fi ©2024</span>
        <span className="mx-4 opacity-50">–</span>
        <a href="/privacy-policy" className="hover:underline opacity-50">
          Privacy policy
        </a>
        <a href="/contact" className="ml-4 hover:underline opacity-50">
          Contact
        </a>
      </div>
      <div className="flex opacity-50">
        <a href="https://discord.gg/adamant" className="mr-4">
          <FaDiscord size={24} />
        </a>
        <a href="https://twitter.com/adamant" className="mr-4">
          <FaTwitter size={24} />
        </a>
        <a href="https://medium.com/adamant" className="mr-4">
          <FaMediumM size={24} />
        </a>
        <a href="https://reddit.com/r/adamant" className="mr-4">
          <FaRedditAlien size={24} />
        </a>
        <a href="https://t.me/adamant">
          <SiTelegram size={24} />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
