import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

const WarningIcon = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg> );

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/70" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-zinc-900 p-6 text-left align-middle shadow-xl transition-all border border-zinc-700">
                <div className="flex items-start gap-4">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-900/50 sm:mx-0">
                    <WarningIcon className="h-6 w-6 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="mt-0 flex-1">
                    <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-white">{title}</Dialog.Title>
                    <div className="mt-2"><p className="text-sm text-zinc-400">{message}</p></div>
                  </div>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
                  <button type="button" className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-500 sm:w-auto" onClick={onConfirm}>Excluir</button>
                  <button type="button" className="w-full rounded-md bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-300 shadow-sm ring-1 ring-inset ring-zinc-700 hover:bg-zinc-700 transition-colors sm:w-auto" onClick={onClose}>Cancelar</button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}