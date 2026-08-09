import { useState, useEffect, useCallback } from "react";
import { fetchMacAddresses, addMacAddresses, deleteMacAddress } from "../api/serviceApi";

export const useMacAddresses = (idserv, showSnackbar) => {
    const [macAddresses, setMacAddresses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const loadMacAddresses = useCallback(() => {
        if (!idserv) return;
        setLoading(true);
        fetchMacAddresses(idserv)
            .then(setMacAddresses)
            .catch((err) => showSnackbar(err.message, true))
            .finally(() => setLoading(false));
    }, [idserv, showSnackbar]);

    useEffect(() => {
        loadMacAddresses();
    }, [loadMacAddresses]);

    // entries: [{ mac_address, description }] — peut être un seul élément
    const handleAdd = async (entries) => {
        setSaving(true);
        try {
            const created = await addMacAddresses(idserv, entries);
            setMacAddresses((prev) => [...prev, ...created]);
            showSnackbar(`${created.length} adresse(s) MAC ajoutée(s)`, false);
            return true;
        } catch (err) {
            showSnackbar(err.message, true);
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (macId) => {
        setDeletingId(macId);
        try {
            await deleteMacAddress(idserv, macId);
            setMacAddresses((prev) => prev.filter((m) => m.id !== macId));
            showSnackbar("Adresse MAC supprimée", false);
        } catch (err) {
            showSnackbar(err.message, true);
        } finally {
            setDeletingId(null);
        }
    };

    return { macAddresses, loading, saving, deletingId, handleAdd, handleDelete, reload: loadMacAddresses };
};