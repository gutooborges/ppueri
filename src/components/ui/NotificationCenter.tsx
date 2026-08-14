import React, { useState } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  Syringe,
  FileText,
  Activity,
  AlertTriangle,
  Calendar,
  Settings,
  ShieldCheck,
  Check,
  Smartphone,
  Mail,
  MessageSquare,
  PlusCircle,
  Filter,
} from 'lucide-react';
import { PediatricNotification, NotificationPreferences, Role } from '../../types/ppueri';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: PediatricNotification[];
  activeRole: Role;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onAddSimulatedNotification: (notification: PediatricNotification) => void;
  preferences: NotificationPreferences;
  onUpdatePreferences: (prefs: NotificationPreferences) => void;
  onSelectNotificationAction?: (actionLink: string, patientId?: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  activeRole,
  onMarkAsRead,
  onMarkAllAsRead,
  onAddSimulatedNotification,
  preferences,
  onUpdatePreferences,
  onSelectNotificationAction,
}) => {
  const [activeTab, setActiveTab] = useState<'todas' | 'nao_lidas' | 'vacinas' | 'exames' | 'configuracoes'>('todas');

  if (!isOpen) return null;

  // Filtrar notificações para a role atual
  const roleFiltered = notifications.filter(
    (n) => n.targetRole === 'ambos' || n.targetRole === activeRole
  );

  const unreadCount = roleFiltered.filter((n) => !n.isRead).length;

  const displayNotifications = roleFiltered.filter((n) => {
    if (activeTab === 'nao_lidas') return !n.isRead;
    if (activeTab === 'vacinas') return n.category === 'vacina';
    if (activeTab === 'exames') return n.category === 'exame' || n.category === 'alerta_clinico';
    return true;
  });

  const getCategoryIcon = (category: PediatricNotification['category'], priority: PediatricNotification['priority']) => {
    switch (category) {
      case 'vacina':
        return <Syringe className="w-4 h-4 text-sky-400" />;
      case 'exame':
        return <FileText className="w-4 h-4 text-cyan-400" />;
      case 'alerta_clinico':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'consulta':
        return <Calendar className="w-4 h-4 text-sky-300" />;
      case 'orientacao':
        return <Activity className="w-4 h-4 text-sky-400" />;
    }
  };

  const getPriorityBadge = (priority: PediatricNotification['priority']) => {
    switch (priority) {
      case 'critica':
        return 'bg-rose-950/80 text-rose-300 border-rose-800 font-extrabold';
      case 'alta':
        return 'bg-amber-950/80 text-amber-300 border-amber-800 font-bold';
      case 'media':
        return 'bg-sky-950/80 text-sky-300 border-sky-800 font-medium';
      case 'baixa':
        return 'bg-slate-800 text-slate-300 border-slate-700 font-normal';
    }
  };

  const handleSimulateNewAlert = () => {
    const categories: PediatricNotification['category'][] = ['vacina', 'exame', 'alerta_clinico', 'orientacao'];
    const randomCat = categories[Math.floor(Math.random() * categories.length)];

    let newNotif: PediatricNotification;

    if (randomCat === 'vacina') {
      newNotif = {
        id: `sim_vac_${Date.now()}`,
        title: 'Alerta PNI: Vacina Meningocócica ACWY',
        message: 'Dose recomendada disponível na rede de vacinação para reforço anual.',
        category: 'vacina',
        targetRole: activeRole,
        priority: 'alta',
        timestamp: new Date().toISOString(),
        isRead: false,
        actionLink: 'vacinas',
      };
    } else if (randomCat === 'exame') {
      newNotif = {
        id: `sim_exam_${Date.now()}`,
        title: 'Novo Laudo de Exame OCR Processado',
        message: 'Hemograma completo importado e verificado sem alterações graves.',
        category: 'exame',
        targetRole: activeRole,
        priority: 'media',
        timestamp: new Date().toISOString(),
        isRead: false,
        actionLink: 'exames',
      };
    } else {
      newNotif = {
        id: `sim_alert_${Date.now()}`,
        title: 'Lembrete de Retorno de Puericultura',
        message: 'Agendamento de consulta de acompanhamento de desenvolvimento em 7 dias.',
        category: 'consulta',
        targetRole: activeRole,
        priority: 'media',
        timestamp: new Date().toISOString(),
        isRead: false,
        actionLink: 'consultas',
      };
    }

    onAddSimulatedNotification(newNotif);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex justify-end">
      <div className="w-full max-w-md bg-slate-900 text-white h-full border-l border-slate-700/80 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        {/* Header Drawer */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30 relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-slate-950" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-white">Central de Notificações</span>
                <span className="bg-sky-950 text-sky-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-800">
                  {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {activeRole === 'medico' ? 'Alertas para a Equipe Médica' : 'Alertas para Pais e Responsáveis'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="p-2 bg-slate-950/50 border-b border-slate-800/80 flex items-center gap-1 overflow-x-auto text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('todas')}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              activeTab === 'todas'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Todas ({roleFiltered.length})
          </button>
          <button
            onClick={() => setActiveTab('nao_lidas')}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              activeTab === 'nao_lidas'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Não Lidas ({unreadCount})
          </button>
          <button
            onClick={() => setActiveTab('vacinas')}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              activeTab === 'vacinas'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Vacinas
          </button>
          <button
            onClick={() => setActiveTab('exames')}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              activeTab === 'exames'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Exames / Clínicos
          </button>
          <button
            onClick={() => setActiveTab('configuracoes')}
            className={`px-2.5 py-1.5 rounded-lg transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'configuracoes'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Preferências de Notificação"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'configuracoes' ? (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="font-bold text-sm text-sky-300 block">Preferências de Alertas & Notificações</span>
                <p className="text-xs text-slate-400">Personalize quais notificações deseja receber em tempo real.</p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/80 cursor-pointer">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-white block">Alertas de Vacinas (PNI/SBP)</span>
                    <span className="text-[11px] text-slate-400 block">Avisos de vacinas pendentes, atrasadas ou agendadas</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.vaccineAlerts}
                    onChange={(e) => onUpdatePreferences({ ...preferences, vaccineAlerts: e.target.checked })}
                    className="w-4 h-4 text-sky-500 rounded focus:ring-sky-500 bg-slate-900 border-slate-700"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/80 cursor-pointer">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-white block">Exames com Valores Críticos</span>
                    <span className="text-[11px] text-slate-400 block">Notificação imediata ao detectar exames alterados por OCR</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.criticalLabAlerts}
                    onChange={(e) => onUpdatePreferences({ ...preferences, criticalLabAlerts: e.target.checked })}
                    className="w-4 h-4 text-sky-500 rounded focus:ring-sky-500 bg-slate-900 border-slate-700"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/80 cursor-pointer">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-white block">Lembretes de Consultas e Retornos</span>
                    <span className="text-[11px] text-slate-400 block">Avisos de puericultura e reavaliações agendadas</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.appointmentReminders}
                    onChange={(e) => onUpdatePreferences({ ...preferences, appointmentReminders: e.target.checked })}
                    className="w-4 h-4 text-sky-500 rounded focus:ring-sky-500 bg-slate-900 border-slate-700"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/80 cursor-pointer">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-white block">Atualização do Plano de Cuidados</span>
                    <span className="text-[11px] text-slate-400 block">Alertas ao médico liberar novas receitas ou orientações</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.newCarePlanAlerts}
                    onChange={(e) => onUpdatePreferences({ ...preferences, newCarePlanAlerts: e.target.checked })}
                    className="w-4 h-4 text-sky-500 rounded focus:ring-sky-500 bg-slate-900 border-slate-700"
                  />
                </label>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="font-bold text-xs text-sky-300 block">Canais de Transmissão Ativos</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-700/60 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-sky-400" />
                    <span>Push Web / App</span>
                  </div>
                  <div className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-700/60 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>SMS / WhatsApp</span>
                  </div>
                </div>
              </div>
            </div>
          ) : displayNotifications.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-500">
                <Bell className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-slate-300">Nenhuma notificação encontrada</div>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Você não possui novos alertas pendentes nesta categoria.
              </p>
            </div>
          ) : (
            displayNotifications.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition-all space-y-2 relative ${
                  item.isRead
                    ? 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                    : 'bg-slate-800/90 border-sky-500/50 text-white shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-800 rounded-lg border border-slate-700">
                      {getCategoryIcon(item.category, item.priority)}
                    </div>
                    <div>
                      {item.patientName && (
                        <span className="text-[10px] font-bold text-sky-400 block">{item.patientName}</span>
                      )}
                      <span className="font-bold text-xs leading-tight block">{item.title}</span>
                    </div>
                  </div>

                  <span className={`text-[9px] px-2 py-0.5 rounded-full border ${getPriorityBadge(item.priority)}`}>
                    {item.priority}
                  </span>
                </div>

                <p className="text-xs text-slate-300 pl-0.5 leading-relaxed">{item.message}</p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
                  <span className="text-slate-500">{new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>

                  <div className="flex items-center gap-2">
                    {item.actionLabel && (
                      <button
                        onClick={() => {
                          onMarkAsRead(item.id);
                          if (onSelectNotificationAction && item.actionLink) {
                            onSelectNotificationAction(item.actionLink, item.patientId);
                            onClose();
                          }
                        }}
                        className="text-sky-400 hover:text-sky-300 font-bold transition-colors"
                      >
                        {item.actionLabel}
                      </button>
                    )}

                    {!item.isRead && (
                      <button
                        onClick={() => onMarkAsRead(item.id)}
                        className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                        title="Marcar como lida"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Drawer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={handleSimulateNewAlert}
            className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 bg-sky-950/80 hover:bg-sky-900 border border-sky-800/80 px-3 py-2 rounded-xl transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Simular Novo Alerta</span>
          </button>

          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl transition-all border border-slate-700"
            >
              <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Marcar todas como lidas</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
