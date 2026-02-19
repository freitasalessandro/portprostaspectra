import AdminLayout from "@/components/AdminLayout";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

const AdminUsuarios = () => (
  <AdminLayout>
    <div>
      <motion.div className="mb-10" initial="hidden" animate="visible" variants={fadeUp}>
        <p className="text-primary/60 tracking-[0.3em] uppercase text-[11px] mb-1.5 font-body flex items-center gap-2">
          <span className="w-6 h-px bg-primary/40" />
          Equipe
        </p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Usuários</h1>
      </motion.div>
      <div className="glass-card-premium p-10 text-center">
        <p className="text-muted-foreground/50 font-body text-sm">Gerenciamento de usuários em breve.</p>
      </div>
    </div>
  </AdminLayout>
);

export default AdminUsuarios;
