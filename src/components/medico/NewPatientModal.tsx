import React, { useState } from 'react';
import { Patient } from '../../types/ppueri';
import { User, Plus, X, Key } from 'lucide-react';

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPatient: (patient: Patient) => void;
  doctorId: string;
}

export const NewPatientModal: React.FC<NewPatientModalProps> = ({ isOpen, onClose, onAddPatient, doctorId }) => {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [motherName, setMotherName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [cpf, setCpf] = useState('');
  const [bloodType, setBloodType] = useState<Patient['bloodType'] | ''>('' );
  const [allergiesText, setAllergiesText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !motherName.trim() || !birthDate || !gender) return;

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const suffix = name.substring(0, 3).toUpperCase();
    const accessCode = `PPUERI-${randomNum}-${suffix}`;

    const newPatient: Patient = {
      id: `pat_${Date.now()}`,
      doctorId,
      name: name.trim(),
      birthDate,
      gender: gender as Patient['gender'],
      motherName: motherName.trim(),
      fatherName: fatherName.trim() || undefined,
      cpf: cpf.trim() || undefined,
      bloodType: bloodType || undefined,
      accessCode,
      accessCodeCreatedAt: new Date().toISOString(),
      allergies: allergiesText ? allergiesText.split(',').map((s) => s.trim()) : [],
      chronicConditions: [],
    };

    onAddPatient(newPatient);
    onClose();
    // Reset form
    setName('');
    setBirthDate('');
    setGender('');
    setMotherName('');
    setFatherName('');
    setCpf('');
    setBloodType('');
    setAllergiesText('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
              <User className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Cadastrar Novo Paciente Pediátrico</h3>
              <p className="text-xs text-slate-500">Criação de prontuário e geração automática de Código de Acesso</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nome Completo do Paciente *</label>
            <input
              type="text"
              required
              placeholder="Ex: Lucas Gabriel da Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Data de Nascimento *</label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Sexo Biológico *</label>
              <select
                required
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold text-slate-800 bg-white"
              >
                <option value="" disabled>Selecione</option>
                <option value="masculino">Masculino (Menino)</option>
                <option value="feminino">Feminino (Menina)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nome da Mãe *</label>
              <input
                type="text"
                required
                placeholder="Nome completo da mãe"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nome do Pai (opcional)</label>
              <input
                type="text"
                placeholder="Nome completo do pai"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">CPF do Menor / Responsável</label>
              <input
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tipo Sanguíneo</label>
              <select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value as any)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold text-slate-800 bg-white"
              >
                <option value="">Não informado</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Alergias Conhecidas (separadas por vírgula):</label>
            <input
              type="text"
              placeholder="Ex: Leite de vaca, Ovo, Dipirona"
              value={allergiesText}
              onChange={(e) => setAllergiesText(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800"
            />
          </div>

          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-[11px] text-sky-900 flex items-center gap-2">
            <Key className="w-4 h-4 text-sky-600 shrink-0" />
            <span>Um Código de Acesso do tipo PPUERI-XXXX-ABC será gerado automaticamente para vinculação dos pais.</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-semibold hover:text-slate-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Prontuário</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
