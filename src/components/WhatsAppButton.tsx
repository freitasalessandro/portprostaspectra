import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "5582933008540";
const WHATSAPP_MESSAGE = encodeURIComponent("Olá! Gostaria de saber mais sobre os serviços da Spectra.");

const WhatsAppButton = () => {
  return (
    <motion.a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 w-12 h-12 md:w-14 md:h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300"
      style={{ boxShadow: "0 4px 20px rgba(34, 197, 94, 0.4)" }}
      aria-label="Chat no WhatsApp"
    >
      <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
      <span className="absolute -top-1 -right-1 w-3 h-3 md:w-3.5 md:h-3.5 bg-red-500 rounded-full border-2 border-background animate-pulse" />
    </motion.a>
  );
};

export default WhatsAppButton;
