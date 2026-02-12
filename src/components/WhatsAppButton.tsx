import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "5511999999999"; // Substitua pelo número real
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
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300"
      style={{ boxShadow: "0 4px 20px rgba(37, 211, 102, 0.4)" }}
      aria-label="Chat no WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-background animate-pulse" />
    </motion.a>
  );
};

export default WhatsAppButton;
