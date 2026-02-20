import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { Plus, Trash2, Shield, UserCog, Mail, Loader2 } from "lucide-react";

interface UserProfile {
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  role: string;
}

const roleLabels: Record<string, string> = {
  admin: "Admin",
  editor: "Editor",
  viewer: "Visualizador",
};

const roleColors: Record<string, string> = {
  admin: "bg-primary/15 text-primary",
  editor: "bg-accent/50 text-accent-foreground",
  viewer: "bg-muted text-muted-foreground",
};

const AdminUsuarios = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [inviting, setInviting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      setCurrentUserId(session.user.id);
      fetchUsers();
    };
    init();
  }, [navigate]);

  const fetchUsers = async () => {
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, email, avatar_url, created_at"),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    if (profilesRes.error) {
      toast({ title: "Erro", description: profilesRes.error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const roleMap: Record<string, string> = {};
    ((rolesRes.data as any[]) || []).forEach((r: any) => {
      roleMap[r.user_id] = r.role;
    });

    const merged: UserProfile[] = ((profilesRes.data as any[]) || []).map((p: any) => ({
      ...p,
      role: roleMap[p.user_id] || "viewer",
    }));

    // Sort: admins first, then by name
    merged.sort((a, b) => {
      if (a.role === "admin" && b.role !== "admin") return -1;
      if (b.role === "admin" && a.role !== "admin") return 1;
      return (a.display_name || a.email || "").localeCompare(b.display_name || b.email || "");
    });

    setUsers(merged);
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);

    try {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: {
          action: "invite",
          email: inviteEmail.trim(),
          display_name: inviteName.trim(),
          role: inviteRole,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Convite enviado!", description: `E-mail enviado para ${inviteEmail}` });
      setShowInvite(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("viewer");
      fetchUsers();
    } catch (e: any) {
      toast({ title: "Erro ao convidar", description: e.message, variant: "destructive" });
    }
    setInviting(false);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Tem certeza que deseja remover este usuário? Essa ação é irreversível.")) return;

    try {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "delete", user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Usuário removido" });
      fetchUsers();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "update_role", user_id: userId, new_role: newRole },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Papel atualizado" });
      fetchUsers();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <motion.div
          className="flex items-center justify-between mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <p className="text-primary/60 tracking-[0.3em] uppercase text-[11px] mb-1.5 font-body flex items-center gap-2">
              <span className="w-6 h-px bg-primary/40" />
              Equipe
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">Usuários</h1>
          </div>
          <Button
            onClick={() => setShowInvite(true)}
            className="font-display uppercase tracking-[0.2em] text-[10px] py-5 px-6 relative overflow-hidden group glow-box"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Convidar
            </span>
          </Button>
        </motion.div>

        {loading ? (
          <div className="text-center text-muted-foreground/40 py-20 font-body text-sm">Carregando...</div>
        ) : (
          <motion.div className="grid gap-3" variants={staggerContainer} initial="hidden" animate="visible">
            {users.map((u) => (
              <motion.div
                key={u.user_id}
                variants={fadeUp}
                className="glass-card-premium p-5 flex items-center justify-between gap-4 group hover:border-primary/30 transition-all duration-500 relative overflow-hidden"
              >
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/0 group-hover:via-primary/30 to-transparent transition-all duration-500" />

                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-display font-bold text-sm">
                    {(u.display_name || u.email || "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-bold text-sm truncate">
                        {u.display_name || "Sem nome"}
                      </h3>
                      {u.user_id === currentUserId && (
                        <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-sm bg-primary/10 text-primary font-bold">
                          Você
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground/60 font-body flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {u.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {u.user_id === currentUserId ? (
                    <span className={`text-[10px] uppercase tracking-[0.15em] px-2.5 py-1 rounded-sm font-bold ${roleColors[u.role]}`}>
                      <Shield className="w-3 h-3 inline mr-1" />
                      {roleLabels[u.role]}
                    </span>
                  ) : (
                    <>
                      <Select value={u.role} onValueChange={(val) => handleRoleChange(u.user_id, val)}>
                        <SelectTrigger className="w-[130px] h-8 text-xs font-display uppercase tracking-widest">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="viewer">Visualizador</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(u.user_id)}
                        title="Remover usuário"
                        className="w-8 h-8 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Invite dialog */}
        <Dialog open={showInvite} onOpenChange={setShowInvite}>
          <DialogContent className="glass-card border-border/30">
            <DialogHeader>
              <DialogTitle className="font-display">Convidar usuário</DialogTitle>
              <DialogDescription className="text-muted-foreground/60">
                Um e-mail será enviado com o link de acesso.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">E-mail *</label>
                <Input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  type="email"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Nome</label>
                <Input
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Nome completo"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Papel</label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin — acesso total</SelectItem>
                    <SelectItem value="editor">Editor — pode criar e editar</SelectItem>
                    <SelectItem value="viewer">Visualizador — somente leitura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInvite(false)}>Cancelar</Button>
              <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                {inviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                Enviar convite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminUsuarios;
