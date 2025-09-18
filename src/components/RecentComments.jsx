import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Link } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';

// --- SUB-COMPONENTES DE VISUALIZAÇÃO ---
const EditIcon = (props) => ( <svg {...props} viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg> );
const DeleteIcon = (props) => ( <svg {...props} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg> );

function EditReplyForm({ reply, onSave, onCancel, isSubmitting }) {
    const [editText, setEditText] = useState(reply.content);
    const handleSubmit = (e) => { e.preventDefault(); onSave(reply.id, editText); };
    return ( <form onSubmit={handleSubmit} className="mt-4"><textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows="2" className="w-full bg-zinc-700 border border-zinc-600 rounded-md p-2 text-white focus:outline-none focus:border-[#f1c40f]" autoFocus /><div className="flex justify-end items-center gap-2 mt-2"><button type="button" onClick={onCancel} className="text-zinc-400 text-sm font-semibold px-3 py-1.5 rounded-md hover:bg-zinc-700">Cancelar</button><button type="submit" disabled={isSubmitting} className="bg-[#f1c40f] text-black text-sm font-bold px-4 py-1.5 rounded-md disabled:bg-zinc-600">{isSubmitting ? 'Salvando...' : 'Salvar'}</button></div></form> );
}

function ReplyItem({ reply, currentUserId, onEdit, onDelete }) {
    return ( <div className="flex items-start space-x-3 mt-4"><img className="h-8 w-8 rounded-full object-cover" src={reply.author.creatorAvatar || `https://ui-avatars.com/api/?name=${reply.author.username?.charAt(0)}`} alt={reply.author.username} /><div className="flex-1 space-y-1 bg-zinc-800 p-3 rounded-lg group"><div className="flex items-center justify-between"><h3 className="text-sm font-bold text-white">{reply.author.username} <span className="text-xs font-normal text-zinc-400">(Parceiro)</span></h3><div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">{currentUserId === reply.user_id && (<><button onClick={() => onEdit(reply)} title="Editar"><EditIcon className="w-4 h-4 text-zinc-400 hover:text-white"/></button><button onClick={() => onDelete(reply.id)} title="Excluir"><DeleteIcon className="w-4 h-4 text-zinc-400 hover:text-red-500"/></button></>)}</div></div><p className="text-sm text-zinc-300">{reply.content}</p></div></div> );
}

function CommentItem({ comment, user, children, onReplyDelete, onReplyUpdate, isSubmitting, editingReplyId, setEditingReplyId }) {
    return ( <li className="py-4 px-2"><div className="flex items-start space-x-3"><img className="h-8 w-8 rounded-full object-cover" src={comment.author.creatorAvatar || `https://ui-avatars.com/api/?name=${comment.author.username?.charAt(0)}`} alt={comment.author.username} /><div className="flex-1 space-y-1"><div className="flex items-center justify-between"><h3 className="text-sm font-bold text-white">{comment.author.username}</h3><p className="text-xs text-zinc-500">{new Date(comment.created_at).toLocaleDateString()}</p></div><p className="text-sm text-zinc-300">{comment.content}</p>{children}{comment.comment_replies?.length > 0 && (<div className="ml-11 mt-4 border-l-2 border-zinc-800 pl-4 space-y-4">{comment.comment_replies.map(reply => editingReplyId === reply.id ? <EditReplyForm key={reply.id} reply={reply} onSave={onReplyUpdate} onCancel={() => setEditingReplyId(null)} isSubmitting={isSubmitting} /> : <ReplyItem key={reply.id} reply={reply} currentUserId={user?.id} onEdit={(r) => setEditingReplyId(r?.id)} onDelete={onReplyDelete} />)}</div>)}</div></div></li> );
}

// --- COMPONENTE PRINCIPAL ---
export default function RecentComments({ userId, user }) {
    const [comments, setComments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [replyToDelete, setReplyToDelete] = useState(null);
    const [activeReplyId, setActiveReplyId] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [editingReplyId, setEditingReplyId] = useState(null);

    const fetchCommentsWithReplies = async () => {
        if (!userId) { setIsLoading(false); return; }
        setIsLoading(true);
        const { data: videosData } = await supabase.from('videos').select('id').eq('creator_id', userId);
        const videoIds = videosData ? videosData.map(v => v.id) : [];
        if (videoIds.length > 0) {
            const { data: commentsData, error } = await supabase.from('comments').select(`*, video_id(id, title), author:user_id(username, creatorAvatar), comment_replies(*, author:user_id(username, creatorAvatar))`).in('video_id', videoIds).order('created_at', { ascending: false }).limit(5);
            if (error) { console.error("Erro:", error); setComments([]); } else { setComments(commentsData || []); }
        } else { setComments([]); }
        setIsLoading(false);
    };

    useEffect(() => { fetchCommentsWithReplies(); }, [userId]);

    const handleReplySubmit = async (commentId) => {
        if (!replyContent.trim()) return;
        setIsSubmitting(true);
        const { data: newReply, error } = await supabase.rpc('add_comment_reply', { parent_id: commentId, reply_content: replyContent });
        if (error) { console.error("Erro:", error); } 
        else {
            const formattedReply = { ...newReply[0], author: { username: newReply[0].username, creatorAvatar: newReply[0].creatorAvatar } };
            setComments(currentComments => currentComments.map(c => c.id === commentId ? { ...c, comment_replies: [...c.comment_replies, formattedReply] } : c));
            setActiveReplyId(null);
            setReplyContent('');
        }
        setIsSubmitting(false);
    };

    const handleReplyUpdate = async (replyId, newContent) => {
        setIsSubmitting(true);
        const { data, error } = await supabase.rpc('edit_comment_reply', { reply_id: replyId, new_content: newContent });
        if (error) { console.error("Erro:", error); } 
        else {
            const updatedReply = data;
            setComments(currentComments => currentComments.map(c => ({ ...c, comment_replies: c.comment_replies.map(r => r.id === replyId ? { ...r, content: updatedReply.content } : r) })));
            setEditingReplyId(null); // <-- Ação crucial para fechar o formulário
        }
        setIsSubmitting(false);
    };
    
    const handleReplyDelete = (replyId) => {
        setReplyToDelete(replyId);
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!replyToDelete) return;
        const { error } = await supabase.from('comment_replies').delete().match({ id: replyToDelete });
        if (error) { console.error("Erro:", error); } 
        else {
            setComments(currentComments => currentComments.map(c => ({ ...c, comment_replies: c.comment_replies.filter(r => r.id !== replyToDelete) })));
        }
        setIsConfirmOpen(false);
        setReplyToDelete(null);
    };

    return (
        <div className="bg-zinc-900 p-4 sm:p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4 text-white">Comentários Recentes</h3>
            {isLoading ? (<p className="text-zinc-400">Carregando...</p>) : comments.length > 0 ? (
                <ul className="divide-y divide-zinc-800">
                    {comments.map(comment => (
                        <CommentItem 
                            key={comment.id} 
                            comment={comment} 
                            user={user} 
                            onReplyUpdate={handleReplyUpdate} 
                            onReplyDelete={handleReplyDelete} 
                            isSubmitting={isSubmitting}
                            editingReplyId={editingReplyId}
                            setEditingReplyId={setEditingReplyId}
                        >
                            <div className="flex items-center gap-4 text-xs text-zinc-400 pt-1">
                                <span>em <Link to={`/video/${comment.video_id.id}`} className="font-semibold hover:underline hover:text-[#f1c40f]">{comment.video_id.title}</Link></span>
                                <button onClick={() => setActiveReplyId(activeReplyId === comment.id ? null : comment.id)} className="font-semibold hover:text-white">{activeReplyId === comment.id ? 'Cancelar' : 'Responder'}</button>
                            </div>
                            {activeReplyId === comment.id && (
                                <form onSubmit={(e) => { e.preventDefault(); handleReplySubmit(comment.id); }} className="mt-4">
                                    <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="Escreva sua resposta..." rows="2" className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-white" autoFocus />
                                    <div className="text-right mt-2"><button type="submit" disabled={isSubmitting} className="bg-[#f1c40f] text-black text-sm font-bold px-4 py-1.5 rounded-md disabled:bg-zinc-600">{isSubmitting ? 'Enviando...' : 'Responder'}</button></div>
                                </form>
                            )}
                        </CommentItem>
                    ))}
                </ul>
            ) : (<p className="text-zinc-400 text-center py-4">Ainda não há comentários.</p>)}
            <ConfirmationModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmDelete} title="Excluir Resposta" message="Tem certeza que deseja excluir esta resposta? Esta ação não pode ser desfeita."/>
        </div>
    );
}