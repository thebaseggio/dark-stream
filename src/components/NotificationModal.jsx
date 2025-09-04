// src/components/NotificationModal.jsx

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

// Ícones SVG para usarmos diretamente no componente
const SuccessIcon = () => (
  <svg className="h-12 w-12 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ErrorIcon = () => (
  <svg className="h-12 w-12 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);


export default function NotificationModal({ isOpen, onClose, type = 'success', message }) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-zinc-900 p-6 text-left align-middle shadow-xl transition-all border border-zinc-700">
                <div className="flex flex-col items-center text-center gap-4">
                  
                  {/* Ícone dinâmico */}
                  {type === 'success' ? <SuccessIcon /> : <ErrorIcon />}

                  <Dialog.Title as="h3" className={`text-lg font-bold leading-6 ${type === 'success' ? 'text-white' : 'text-red-400'}`}>
                    {type === 'success' ? 'Sucesso!' : 'Ocorreu um Erro'}
                  </Dialog.Title>
                  
                  <div className="mt-2">
                    <p className="text-sm text-gray-300">
                      {message}
                    </p>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      className={`inline-flex justify-center rounded-md border border-transparent px-8 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 
                        ${type === 'success' ? 'bg-[#f1c40f] text-black hover:bg-yellow-400 focus-visible:ring-yellow-500' : 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500'}`}
                      onClick={onClose}
                    >
                      Ok
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}