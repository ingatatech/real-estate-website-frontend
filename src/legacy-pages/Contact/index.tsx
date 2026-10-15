'use client'

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from '@/navigation/legacy-router';
import api from '../../services/api';

const contactDetails = {
	phone: '+250 796 593 119',
	email: 'ingatatechnologiesltd@gmail.com',
	whatsapp: '+250796593119',
	address: 'KG 11 Ave, Zindiro, AZAM Rond Point, Gasabo-Kigali',
	mapQuery: 'KG 11 Ave, Zindiro, AZAM Rond Point, Gasabo-Kigali',
};

function ContactForm() {
	const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
	const [status, setStatus] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const submit = async (event: FormEvent) => {
		event.preventDefault();
		setStatus('');
		setSubmitting(true);
		try {
			await api.createContact(form);
			setStatus('Thanks. Your message has been sent.');
			setForm({ name: '', email: '', phone: '', subject: '', message: '' });
		} catch (error) {
			setStatus(error instanceof Error ? error.message : 'Unable to send your message. Please try again.');
		} finally {
			setSubmitting(false);
		}
	};
	return <form onSubmit={submit} className="space-y-4"><h2 className="text-2xl font-bold text-brand-navy">Send us a message</h2>{(['name', 'email', 'phone', 'subject'] as const).map((field) => <label key={field} className="block text-brand-charcoal capitalize">{field}<input required={['name', 'email'].includes(field)} type={field === 'email' ? 'email' : 'text'} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="search-input" /></label>)}<label className="block text-brand-charcoal">Message<textarea required value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} className="search-input min-h-32" /></label><button disabled={submitting} className="bg-brand-emerald text-brand-white rounded-lg px-6 py-3 disabled:opacity-60">{submitting ? 'Sending...' : 'Send message'}</button>{status && <p className="text-brand-emerald">{status}</p>}</form>;
}

function InquiryForm() {
	const [form, setForm] = useState({ propertyId: '', name: '', email: '', phone: '', inquiry: '' });
	const [status, setStatus] = useState('');
	const submit = async (event: FormEvent) => { event.preventDefault(); try { await api.createInquiry(form); setStatus('Your property inquiry has been sent.'); } catch { setStatus('Unable to send your inquiry.'); } };
	return <form onSubmit={submit} className="space-y-4"><h2 className="text-2xl font-bold text-brand-navy">Ask about a property</h2>{(['propertyId', 'name', 'email', 'phone'] as const).map((field) => <label key={field} className="block text-brand-charcoal">{field === 'propertyId' ? 'Property ID or reference' : field}<input required={['name', 'email'].includes(field)} type={field === 'email' ? 'email' : 'text'} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="search-input" /></label>)}<label className="block text-brand-charcoal">Message<textarea required value={form.inquiry} onChange={(event) => setForm({ ...form, inquiry: event.target.value })} className="search-input min-h-32" /></label><button className="bg-brand-emerald text-brand-white rounded-lg px-6 py-3">Send inquiry</button>{status && <p className="text-brand-emerald">{status}</p>}</form>;
}

export default function Contact() {
	return <main className="bg-brand-background min-h-screen py-12"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><p className="text-sm font-semibold uppercase tracking-wider text-brand-emerald">Get in touch</p><h1 className="text-4xl font-bold text-brand-navy mt-2 mb-8">Contact Ingata Real Estate</h1><div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10"><section className="bg-brand-white border border-slate-200 rounded-xl p-6"><h2 className="text-xl font-bold text-brand-navy mb-4">Contact information</h2><div className="space-y-3 text-brand-charcoal"><a href={`tel:${contactDetails.phone.replace(/\s/g, '')}`} className="block hover:text-brand-emerald">Call: {contactDetails.phone}</a><a href={`mailto:${contactDetails.email}`} className="block hover:text-brand-emerald">Email: {contactDetails.email}</a><a href={`https://wa.me/${contactDetails.whatsapp}`} target="_blank" rel="noreferrer" className="block hover:text-brand-emerald">WhatsApp us</a><p>Office: {contactDetails.address}</p></div><div className="flex gap-4 mt-6"><a href="https://www.facebook.com/" target="_blank" rel="noreferrer" className="text-brand-emerald">Facebook</a><a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="text-brand-emerald">Instagram</a><a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" className="text-brand-emerald">LinkedIn</a></div></section><section className="bg-brand-white border border-slate-200 rounded-xl p-6 lg:col-span-2"><ContactForm /></section></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><section className="bg-brand-white border border-slate-200 rounded-xl p-6"><InquiryForm /><p className="text-sm text-slate-500 mt-4">For a scheduled visit, use our <Link to="/request-viewing" className="text-brand-emerald">property viewing request</Link>.</p></section><section className="bg-brand-white border border-slate-200 rounded-xl p-6"><h2 className="text-2xl font-bold text-brand-navy mb-4">Find our office</h2><p className="text-brand-charcoal mb-4">{contactDetails.address}</p><iframe title="Office location map" src={`https://www.google.com/maps?q=${encodeURIComponent(contactDetails.mapQuery)}&output=embed`} className="w-full h-80 rounded-lg border-0" loading="lazy" /><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactDetails.mapQuery)}`} target="_blank" rel="noreferrer" className="inline-block mt-4 text-brand-emerald">Get directions</a></section></div></div></main>;
}
