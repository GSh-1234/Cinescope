import React, { useState } from 'react';
import { X, Key, Check, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { getApiKey, setApiKey, resetApiKey } from '../services/omdbApi';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyChanged: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeyChanged,
}) => {
  const [keyInput, setKeyInput] = useState(getApiKey());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleTestAndSave = async (keyToUse: string) => {
    const trimmed = keyToUse.trim();
    if (!trimmed) {
      setTestResult({ success: false, message: 'API key cannot be empty.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(`https://www.omdbapi.com/?apikey=${trimmed}&s=Batman&page=1`);
      const data = await res.json();

      if (data.Response === 'True') {
        setApiKey(trimmed);
        setTestResult({
          success: true,
          message: 'API Key verified successfully! Saved.',
        });
        onKeyChanged();
      } else {
        setTestResult({
          success: false,
          message: data.Error || 'Invalid API key. Please check and try again.',
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Network test failed.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleReset = () => {
    resetApiKey();
    const defaultKey = getApiKey();
    setKeyInput(defaultKey);
    handleTestAndSave(defaultKey);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-5 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">OMDb API Configuration</h3>
              <p className="text-xs text-slate-400">Configure or verify your API access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            OMDb API Key
          </label>
          <div className="relative">
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="e.g. b9a5e69d"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          <p className="text-[11px] text-slate-500">
            A free working key is already preloaded. You can get your own free key from{' '}
            <a
              href="https://www.omdbapi.com/apikey.aspx"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:underline"
            >
              omdbapi.com
            </a>
            .
          </p>
        </div>

        {/* Test Result Banner */}
        {testResult && (
          <div
            className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {testResult.success ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-indigo-400 underline underline-offset-4"
          >
            Reset to Default Key
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={testing}
              onClick={() => handleTestAndSave(keyInput)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Test & Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

