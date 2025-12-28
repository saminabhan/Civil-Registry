import { useState } from "react";
import { useUsers, useCreateUser, useToggleUserStatus } from "@/hooks/use-users";
import { Loader2, Plus, UserCheck, UserX, Shield, ShieldAlert, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import type { User } from "@shared/schema";

const createUserSchema = z.object({
  username: z.string().min(3, "يجب أن يكون الاسم 3 أحرف على الأقل"),
  password: z.string().min(6, "يجب أن تكون كلمة المرور 6 أحرف على الأقل"),
  isAdmin: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export default function Users() {
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading } = useUsers(currentPage);
  const { mutate: toggleStatus } = useToggleUserStatus();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleToggleStatus = (id: number, isActive: boolean) => {
    if (id === 1) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "لا يمكن تعديل حساب System Admin",
      });
      return;
    }
    
    toggleStatus({ id, isActive }, {
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.message || "حدث خطأ أثناء تعديل الحالة";
        toast({
          variant: "destructive",
          title: "خطأ",
          description: errorMessage,
        });
      },
    });
  };
  
  const users = data?.data || [];
  const pagination = data ? {
    currentPage: data.currentPage || 1,
    lastPage: data.lastPage || 1,
    total: data.total || 0,
  } : null;

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة المستخدمين</h1>
          <p className="text-muted-foreground mt-2">إضافة وتعديل صلاحيات المستخدمين</p>
        </div>
        
        <CreateUserDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold text-sm text-foreground">المستخدم</th>
                <th className="px-6 py-4 font-semibold text-sm text-foreground">الصلاحية</th>
                <th className="px-6 py-4 font-semibold text-sm text-foreground">تاريخ الإنشاء</th>
                <th className="px-6 py-4 font-semibold text-sm text-foreground">الحالة</th>
                <th className="px-6 py-4 font-semibold text-sm text-foreground">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users?.map((user: User) => (
                <tr key={user.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.isAdmin ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        <Shield className="w-3 h-3" />
                        مسؤول
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        <UserCheck className="w-3 h-3" />
                        مستخدم
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(user.createdAt!).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.isActive 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-green-500" : "bg-red-500"}`} />
                      {user.isActive ? "نشط" : "معطل"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.id === 1 ? (
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={user.isActive}
                          disabled
                          className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300 opacity-50 cursor-not-allowed"
                        />
                        <span className={`text-sm font-medium transition-colors ${
                          user.isActive ? "text-green-600" : "text-gray-500"
                        }`}>
                          {user.isActive ? "نشط" : "معطل"}
                        </span>
                        <span className="text-xs text-muted-foreground">(مدير النظام)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={(checked) => handleToggleStatus(user.id, checked)}
                          className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300"
                        />
                        <span className={`text-sm font-medium transition-colors ${
                          user.isActive ? "text-green-600" : "text-gray-500"
                        }`}>
                          {user.isActive ? "نشط" : "معطل"}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagination && pagination.lastPage > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              lastPage={pagination.lastPage}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}
    </div>
  );
}

function CreateUserDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { mutate: createUser, isPending } = useCreateUser();
  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      isAdmin: false,
      isActive: true,
    }
  });

  const onSubmit = (data: CreateUserForm) => {
    createUser(data, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          <span>إضافة مستخدم</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-right">إضافة مستخدم جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">اسم المستخدم</label>
            <input
              {...form.register("username")}
              className="w-full px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 outline-none"
            />
            {form.formState.errors.username && (
              <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">كلمة المرور</label>
            <input
              {...form.register("password")}
              type="password"
              className="w-full px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 outline-none"
            />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="isAdmin" 
              {...form.register("isAdmin")}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="isAdmin" className="text-sm font-medium cursor-pointer">منح صلاحيات المسؤول (Admin)</label>
          </div>

          <button
            disabled={isPending}
            className="w-full mt-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "حفظ المستخدم"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
