// src/components/PageTransition.jsx

import React from 'react';
import { motion } from 'framer-motion';

export default function PageTransition() {
  return (
    <motion.div
      className="fixed inset-0 bg-black z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    />
  );
}