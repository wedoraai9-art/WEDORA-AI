import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckSquare,
  Users,
  Wallet,
  FileText,
  Bell,
  Sparkles,
  MapPin,
  Heart,
  Plus,
  Trash2,
  Edit3,
  Download,
} from 'lucide-react';
import { authAxios } from '../../lib/auth';

const emptyExpense = {
  title: '',
  category: 'General',
  amount: '',
  expense_date: '',
  notes: '',
};

const emptyPayment = {
  title: '',
  payment_type: 'payment',
  amount: '',
  payment_date: '',
  notes: '',
};

const DECORATOR_ELEMENT_CATEGORIES = [
  'General',
  'Mandap',
  'Stage',
  'Entrance',
  'Furniture',
  'Flooring & Carpet',
  'Floral',
  'Lighting',
  'Truss',
  'Sound & AV',
  'Fabric & Draping',
  'Decor Props',
  'Table Decor',
  'Printing & Branding',
  'Electrical',
  'Production',
  'Transportation',
  'Signage',
  'Other',
  'Custom',
];

const COMMON_DECOR_ITEMS = [
  'Platform',
  'Carpet',
  'Decor Truss',
  'Sound Truss',
  'Flex',
  'Backdrop',
  'Riser',
  'Podium',
  'Stall',
  'Panel',
  'Table',
  'Chair',
  'Sofa',
  'Backdrop Fabric',
  'Fairy Lights',
  'Chandelier',
  'Signage',
  'Props',
];

const WeddingWorkspace = ({ wedding, vendor, onBack }) => {
  const [activeModule, setActiveModule] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientRelation, setClientRelation] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [savingClient, setSavingClient] = useState(false);
  const [editingClientId, setEditingClientId] = useState(null);
  const [editingTaskIndex, setEditingTaskIndex] = useState(null);

  const [budgetData, setBudgetData] = useState({
    budget: {
      total_budget: Number(wedding?.budget || 0),
      total_expenses: 0,
      total_payments: 0,
      remaining_budget: Number(wedding?.budget || 0),
      payment_balance: 0,
    },
    expenses: [],
    payments: [],
  });
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState(emptyExpense);
  const [paymentForm, setPaymentForm] = useState(emptyPayment);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingPaymentId, setEditingPaymentId] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentUploading, setDocumentUploading] = useState(false);
  const [documentEditingId, setDocumentEditingId] = useState(null);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [documentFile, setDocumentFile] = useState(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentCategory, setDocumentCategory] = useState('General');

  const [notifications, setNotifications] = useState([]);
  const [notificationsUnreadCount, setNotificationsUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationSaving, setNotificationSaving] = useState(false);
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('reminder');
  const [notificationPriority, setNotificationPriority] = useState('normal');
  const [notificationReminderDate, setNotificationReminderDate] = useState('');

  const [designData, setDesignData] = useState({
    theme: '',
    concept: '',
    palette: [],
    mandap: '',
    stage: '',
    entrance: '',
    table_decor: '',
    lighting: '',
    florals: '',
    notes: '',
    status: 'draft',
    reference_images: [],
  });
  const [designLoading, setDesignLoading] = useState(false);
  const [designSaving, setDesignSaving] = useState(false);
  const [designDeleting, setDesignDeleting] = useState(false);
  const [designReferenceUrl, setDesignReferenceUrl] = useState('');

  const emptyElement = {
    name: '',
    category: 'General',
    quantity: '1',
    unit: 'pcs',
    dimensions: '',
    area: '',
    status: 'planned',
    notes: '',
  };
  const [elements, setElements] = useState([]);
  const [elementsLoading, setElementsLoading] = useState(false);
  const [elementSaving, setElementSaving] = useState(false);
  const [elementDeletingId, setElementDeletingId] = useState(null);
  const [showElementForm, setShowElementForm] = useState(false);
  const [editingElementId, setEditingElementId] = useState(null);
  const [elementForm, setElementForm] = useState(emptyElement);
  const [customElementCategories, setCustomElementCategories] = useState([]);
  const [elementCategoriesLoading, setElementCategoriesLoading] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [saveCustomCategory, setSaveCustomCategory] = useState(true);
  const [customCategorySaving, setCustomCategorySaving] = useState(false);

  useEffect(() => {
    if (wedding?.id) {
      loadClients();
      loadBudget();
      loadDocuments();
      loadNotifications();
      if (isDecorator) {
        loadDesign();
        loadElements();
        loadElementCategories();
      }
    }
  }, [wedding?.id]);

  if (!wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#2D2638]">
        Wedding not found.
      </div>
    );
  }

  const loadClients = async () => {
    try {
      const response = await authAxios.get(
        `/vendor/weddings/${wedding.id}/clients`
      );
      setClients(response.data.clients || []);
    } catch (error) {
      console.error("Failed to load clients:", error);
    }
  };

  const loadBudget = async () => {
    setBudgetLoading(true);
    try {
      const response = await authAxios.get(
        `/vendor/weddings/${wedding.id}/budget`
      );
      setBudgetData({
        budget: response.data?.budget || budgetData.budget,
        expenses: response.data?.expenses || [],
        payments: response.data?.payments || [],
      });
    } catch (error) {
      console.error("Failed to load wedding budget:", error);
    } finally {
      setBudgetLoading(false);
    }
  };

  const loadDocuments = async () => {
    setDocumentsLoading(true);
    try {
      const response = await authAxios.get(
        `/vendor/weddings/${wedding.id}/documents`
      );
      setDocuments(response.data?.documents || []);
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const resetDocumentForm = () => {
    setShowDocumentForm(false);
    setDocumentEditingId(null);
    setDocumentFile(null);
    setDocumentTitle('');
    setDocumentCategory('General');
  };

  const saveDocument = async () => {
    if (documentEditingId) {
      if (!documentTitle.trim()) return;

      setDocumentUploading(true);
      try {
        await authAxios.put(
          `/vendor/weddings/${wedding.id}/documents/${documentEditingId}`,
          {
            title: documentTitle.trim(),
            category: documentCategory || 'General',
          }
        );
        resetDocumentForm();
        await loadDocuments();
      } catch (error) {
        console.error("Failed to update document:", error);
        window.alert(error.response?.data?.detail || 'Could not update document.');
      } finally {
        setDocumentUploading(false);
      }
      return;
    }

    if (!documentFile || documentUploading) return;

    const maxBytes = 10 * 1024 * 1024;
    if (documentFile.size > maxBytes) {
      window.alert('Document must be 10 MB or smaller.');
      return;
    }

    setDocumentUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', documentFile);
      formData.append('title', documentTitle.trim());
      formData.append('category', documentCategory || 'General');

      await authAxios.post(
        `/vendor/weddings/${wedding.id}/documents`,
        formData,
        {}
      );

      resetDocumentForm();
      await loadDocuments();
    } catch (error) {
      console.error("Failed to upload document:", error);
      window.alert(error.response?.data?.detail || 'Could not upload document.');
    } finally {
      setDocumentUploading(false);
    }
  };

  const editDocument = (document) => {
    setDocumentEditingId(document.id);
    setDocumentTitle(document.title || '');
    setDocumentCategory(document.category || 'General');
    setDocumentFile(null);
    setShowDocumentForm(true);
  };

  const deleteDocument = async (id) => {
    if (!window.confirm('Delete this document?')) return;

    try {
      await authAxios.delete(
        `/vendor/weddings/${wedding.id}/documents/${id}`
      );
      await loadDocuments();
    } catch (error) {
      console.error("Failed to delete document:", error);
      window.alert(error.response?.data?.detail || 'Could not delete document.');
    }
  };

  const downloadDocument = (document) => {
    if (!document?.data_url && !document?.url) {
      window.alert('This document is not available for download.');
      return;
    }

    const link = window.document.createElement('a');
    link.href = document.data_url || document.url;
    link.download = document.file_name || document.filename || document.title || 'document';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    window.document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const formatFileSize = (bytes) => {
    const size = Number(bytes || 0);
    if (!size) return '0 KB';
    if (size < 1024 * 1024) {
      return `${Math.max(1, Math.round(size / 1024))} KB`;
    }
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const loadDesign = async () => {
    if (!wedding?.id || !isDecorator) return;
    setDesignLoading(true);
    try {
      const response = await authAxios.get(`/vendor/weddings/${wedding.id}/design`);
      const data = response.data?.design || response.data || {};
      setDesignData({
        theme: data.theme || '',
        concept: data.concept || '',
        palette: Array.isArray(data.palette) ? data.palette : [],
        mandap: data.mandap || '',
        stage: data.stage || '',
        entrance: data.entrance || '',
        table_decor: data.table_decor || '',
        lighting: data.lighting || '',
        florals: data.florals || '',
        notes: data.notes || '',
        status: data.status || 'draft',
        reference_images: Array.isArray(data.reference_images) ? data.reference_images : [],
      });
    } catch (error) {
      console.error("Failed to load wedding design:", error);
    } finally {
      setDesignLoading(false);
    }
  };

  const saveDesign = async () => {
    if (!isDecorator || designSaving) return;
    setDesignSaving(true);
    try {
      const payload = {
        ...designData,
        theme: designData.theme.trim(),
        concept: designData.concept.trim(),
        mandap: designData.mandap.trim(),
        stage: designData.stage.trim(),
        entrance: designData.entrance.trim(),
        table_decor: designData.table_decor.trim(),
        lighting: designData.lighting.trim(),
        florals: designData.florals.trim(),
        notes: designData.notes.trim(),
        palette: (designData.palette || []).map((item) => String(item).trim()).filter(Boolean).slice(0, 12),
        reference_images: (designData.reference_images || []).map((item) => String(item).trim()).filter(Boolean).slice(0, 20),
      };
      const response = await authAxios.put(`/vendor/weddings/${wedding.id}/design`, payload);
      const saved = response.data?.design || response.data || payload;
      setDesignData({
        ...payload,
        palette: Array.isArray(saved.palette) ? saved.palette : payload.palette,
        reference_images: Array.isArray(saved.reference_images) ? saved.reference_images : payload.reference_images,
        status: saved.status || payload.status || 'draft',
      });
    } catch (error) {
      console.error("Failed to save wedding design:", error);
      window.alert(error.response?.data?.detail || 'Could not save wedding design.');
    } finally {
      setDesignSaving(false);
    }
  };

  const deleteDesign = async () => {
    if (!isDecorator || designDeleting) return;
    if (!window.confirm('Delete the saved design for this wedding?')) return;
    setDesignDeleting(true);
    try {
      await authAxios.delete(`/vendor/weddings/${wedding.id}/design`);
      setDesignData({
        theme: '',
        concept: '',
        palette: [],
        mandap: '',
        stage: '',
        entrance: '',
        table_decor: '',
        lighting: '',
        florals: '',
        notes: '',
        status: 'draft',
        reference_images: [],
      });
    } catch (error) {
      console.error("Failed to delete wedding design:", error);
      window.alert(error.response?.data?.detail || 'Could not delete wedding design.');
    } finally {
      setDesignDeleting(false);
    }
  };

  const addDesignPaletteColor = () => {
    if ((designData.palette || []).length >= 12) return;
    setDesignData((current) => ({ ...current, palette: [...(current.palette || []), '#'] }));
  };

  const updateDesignPaletteColor = (index, value) => {
    setDesignData((current) => ({
      ...current,
      palette: (current.palette || []).map((item, itemIndex) => itemIndex === index ? value : item),
    }));
  };

  const removeDesignPaletteColor = (index) => {
    setDesignData((current) => ({
      ...current,
      palette: (current.palette || []).filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const addDesignReference = () => {
    const value = designReferenceUrl.trim();
    if (!value || (designData.reference_images || []).length >= 20) return;
    setDesignData((current) => ({
      ...current,
      reference_images: [...(current.reference_images || []), value],
    }));
    setDesignReferenceUrl('');
  };

  const removeDesignReference = (index) => {
    setDesignData((current) => ({
      ...current,
      reference_images: (current.reference_images || []).filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const loadElementCategories = async () => {
    if (!isDecorator) return;
    setElementCategoriesLoading(true);
    try {
      const response = await authAxios.get('/vendor/element-categories');
      setCustomElementCategories(response.data?.categories || []);
    } catch (error) {
      console.error("Failed to load element categories:", error);
    } finally {
      setElementCategoriesLoading(false);
    }
  };

  const saveElementCategory = async () => {
    const name = customCategoryName.trim();
    if (!name || customCategorySaving) return;

    if (DECORATOR_ELEMENT_CATEGORIES.some((item) => item.toLowerCase() === name.toLowerCase())) {
      window.alert('This is already a standard category.');
      return;
    }

    setCustomCategorySaving(true);
    try {
      const response = await authAxios.post('/vendor/element-categories', { name });
      const saved = response.data?.category;
      if (saved?.name) {
        setCustomElementCategories((current) => {
          const exists = current.some((item) => String(item.name).toLowerCase() === saved.name.toLowerCase());
          return exists ? current : [...current, saved];
        });
        setElementForm((current) => ({ ...current, category: saved.name }));
        setCustomCategoryName('');
        setElementForm((current) => ({ ...current, category: saved.name }));
      }
    } catch (error) {
      console.error("Failed to save custom category:", error);
      window.alert(error.response?.data?.detail || 'Could not save custom category.');
    } finally {
      setCustomCategorySaving(false);
    }
  };

  const deleteElementCategory = async (categoryId, categoryName) => {
    if (!window.confirm(`Remove the saved category \"${categoryName}\"? Existing elements will not be deleted.`)) return;
    try {
      await authAxios.delete(`/vendor/element-categories/${categoryId}`);
      setCustomElementCategories((current) => current.filter((item) => item.id !== categoryId));
      if (elementForm.category === categoryName) {
        setElementForm((current) => ({ ...current, category: 'General' }));
      }
    } catch (error) {
      console.error("Failed to delete custom category:", error);
      window.alert(error.response?.data?.detail || 'Could not delete custom category.');
    }
  };

  const selectCommonElement = (name) => {
    if (!name) return;
    setElementForm((current) => ({ ...current, name }));
  };

  const loadElements = async () => {
    if (!wedding?.id || !isDecorator) return;
    setElementsLoading(true);
    try {
      const response = await authAxios.get(`/vendor/weddings/${wedding.id}/elements`);
      setElements(response.data?.elements || []);
    } catch (error) {
      console.error("Failed to load wedding elements:", error);
    } finally {
      setElementsLoading(false);
    }
  };

  const resetElementForm = () => {
    setElementForm(emptyElement);
    setEditingElementId(null);
    setCustomCategoryName('');
    setShowElementForm(false);
  };

  const saveElement = async () => {
    if (!isDecorator || !elementForm.name.trim() || !Number(elementForm.quantity) || elementSaving) return;

    setElementSaving(true);
    try {
      let finalCategory = elementForm.category || 'General';
      if (finalCategory === 'Custom') {
        finalCategory = customCategoryName.trim();
        if (!finalCategory) {
          window.alert('Enter a custom category name first.');
          setElementSaving(false);
          return;
        }
        if (saveCustomCategory) {
          const response = await authAxios.post('/vendor/element-categories', { name: finalCategory });
          const saved = response.data?.category;
          if (saved?.name) {
            finalCategory = saved.name;
            setCustomElementCategories((current) => {
              const exists = current.some((item) => String(item.name).toLowerCase() === saved.name.toLowerCase());
              return exists ? current : [...current, saved];
            });
          }
        }
      }

      const payload = {
        name: elementForm.name.trim(),
        category: finalCategory,
        quantity: Number(elementForm.quantity),
        unit: elementForm.unit.trim() || 'pcs',
        dimensions: elementForm.dimensions.trim(),
        area: elementForm.area.trim(),
        status: elementForm.status || 'planned',
        notes: elementForm.notes.trim(),
      };

      if (editingElementId) {
        await authAxios.put(
          `/vendor/weddings/${wedding.id}/elements/${editingElementId}`,
          payload
        );
      } else {
        await authAxios.post(`/vendor/weddings/${wedding.id}/elements`, payload);
      }

      resetElementForm();
      await loadElements();
    } catch (error) {
      console.error("Failed to save wedding element:", error);
      window.alert(error.response?.data?.detail || 'Could not save wedding element.');
    } finally {
      setElementSaving(false);
    }
  };

  const editElement = (element) => {
    setEditingElementId(element.id);
    setElementForm({
      name: element.name || '',
      category: element.category || 'General',
      quantity: String(element.quantity ?? 1),
      unit: element.unit || 'pcs',
      dimensions: element.dimensions || '',
      area: element.area || '',
      status: element.status || 'planned',
      notes: element.notes || '',
    });
    setShowElementForm(true);
  };

  const deleteElement = async (id) => {
    if (!window.confirm('Delete this wedding element?')) return;
    setElementDeletingId(id);
    try {
      await authAxios.delete(`/vendor/weddings/${wedding.id}/elements/${id}`);
      setElements((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to delete wedding element:", error);
      window.alert(error.response?.data?.detail || 'Could not delete wedding element.');
    } finally {
      setElementDeletingId(null);
    }
  };

  const loadNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const response = await authAxios.get(
        `/vendor/weddings/${wedding.id}/notifications`
      );
      setNotifications(response.data?.notifications || []);
      setNotificationsUnreadCount(Number(response.data?.unread_count || 0));
    } catch (error) {
      console.error("Failed to load wedding notifications:", error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const resetNotificationForm = () => {
    setShowNotificationForm(false);
    setNotificationTitle('');
    setNotificationMessage('');
    setNotificationType('reminder');
    setNotificationPriority('normal');
    setNotificationReminderDate('');
  };

  const saveNotification = async () => {
    if (!notificationTitle.trim() || notificationSaving) return;

    setNotificationSaving(true);
    try {
      await authAxios.post(
        `/vendor/weddings/${wedding.id}/notifications`,
        {
          title: notificationTitle.trim(),
          message: notificationMessage.trim(),
          notification_type: notificationType,
          reminder_date: notificationReminderDate,
          priority: notificationPriority,
        }
      );

      resetNotificationForm();
      await loadNotifications();
    } catch (error) {
      console.error("Failed to create notification:", error);
      window.alert(error.response?.data?.detail || 'Could not create notification.');
    } finally {
      setNotificationSaving(false);
    }
  };

  const toggleNotificationRead = async (notification) => {
    try {
      const response = await authAxios.patch(
        `/vendor/weddings/${wedding.id}/notifications/${notification.id}`,
        { read: !notification.read }
      );

      const updated = response.data;
      setNotifications((current) =>
        current.map((item) => item.id === notification.id ? updated : item)
      );
      setNotificationsUnreadCount((current) =>
        updated.read ? Math.max(0, current - 1) : current + 1
      );
    } catch (error) {
      console.error("Failed to update notification:", error);
      window.alert(error.response?.data?.detail || 'Could not update notification.');
    }
  };

  const markAllNotificationsRead = async () => {
    if (!notificationsUnreadCount) return;

    try {
      await authAxios.post(
        `/vendor/weddings/${wedding.id}/notifications/read-all`
      );
      setNotifications((current) =>
        current.map((item) => ({ ...item, read: true }))
      );
      setNotificationsUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
      window.alert(error.response?.data?.detail || 'Could not mark notifications as read.');
    }
  };

  const deleteNotification = async (id) => {
    if (!window.confirm('Delete this notification?')) return;

    try {
      const notification = notifications.find((item) => item.id === id);
      await authAxios.delete(
        `/vendor/weddings/${wedding.id}/notifications/${id}`
      );
      setNotifications((current) => current.filter((item) => item.id !== id));
      if (notification && !notification.read) {
        setNotificationsUnreadCount((current) => Math.max(0, current - 1));
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
      window.alert(error.response?.data?.detail || 'Could not delete notification.');
    }
  };

  const saveClient = async () => {
    if (!clientName.trim() || savingClient) return;

    setSavingClient(true);

    try {
      await authAxios.post(
        `/vendor/weddings/${wedding.id}/clients`,
        {
          name: clientName.trim(),
          phone: clientPhone,
          email: clientEmail,
          relation: clientRelation,
          notes: clientNotes,
        }
      );

      resetClientForm();
      await loadClients();
    } catch (error) {
      console.error("Failed to save client:", error);
    } finally {
      setSavingClient(false);
    }
  };

  const updateClient = async () => {
    if (!editingClientId || !clientName.trim() || savingClient) return;

    setSavingClient(true);

    try {
      await authAxios.put(
        `/vendor/weddings/${wedding.id}/clients/${editingClientId}`,
        {
          name: clientName.trim(),
          phone: clientPhone,
          email: clientEmail,
          relation: clientRelation,
          notes: clientNotes,
        }
      );

      resetClientForm();
      await loadClients();
    } catch (error) {
      console.error("Failed to update client:", error);
    } finally {
      setSavingClient(false);
    }
  };

  const resetClientForm = () => {
    setClientName("");
    setClientPhone("");
    setClientEmail("");
    setClientRelation("");
    setClientNotes("");
    setEditingClientId(null);
    setShowClientForm(false);
  };

  const resetExpenseForm = () => {
    setExpenseForm(emptyExpense);
    setEditingExpenseId(null);
    setShowExpenseForm(false);
  };

  const resetPaymentForm = () => {
    setPaymentForm(emptyPayment);
    setEditingPaymentId(null);
    setShowPaymentForm(false);
  };

  const saveExpense = async () => {
    if (!expenseForm.title.trim() || !Number(expenseForm.amount) || budgetSaving) return;
    setBudgetSaving(true);
    try {
      const payload = {
        ...expenseForm,
        title: expenseForm.title.trim(),
        amount: Number(expenseForm.amount),
      };
      if (editingExpenseId) {
        await authAxios.put(
          `/vendor/weddings/${wedding.id}/expenses/${editingExpenseId}`,
          payload
        );
      } else {
        await authAxios.post(`/vendor/weddings/${wedding.id}/expenses`, payload);
      }
      resetExpenseForm();
      await loadBudget();
    } catch (error) {
      console.error("Failed to save expense:", error);
      window.alert(error.response?.data?.detail || 'Could not save expense.');
    } finally {
      setBudgetSaving(false);
    }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await authAxios.delete(`/vendor/weddings/${wedding.id}/expenses/${id}`);
      await loadBudget();
    } catch (error) {
      console.error("Failed to delete expense:", error);
      window.alert(error.response?.data?.detail || 'Could not delete expense.');
    }
  };

  const savePayment = async () => {
    if (!paymentForm.title.trim() || !Number(paymentForm.amount) || budgetSaving) return;
    setBudgetSaving(true);
    try {
      const payload = {
        ...paymentForm,
        title: paymentForm.title.trim(),
        amount: Number(paymentForm.amount),
      };
      if (editingPaymentId) {
        await authAxios.put(
          `/vendor/weddings/${wedding.id}/payments/${editingPaymentId}`,
          payload
        );
      } else {
        await authAxios.post(`/vendor/weddings/${wedding.id}/payments`, payload);
      }
      resetPaymentForm();
      await loadBudget();
    } catch (error) {
      console.error("Failed to save payment:", error);
      window.alert(error.response?.data?.detail || 'Could not save payment.');
    } finally {
      setBudgetSaving(false);
    }
  };

  const deletePayment = async (id) => {
    if (!window.confirm('Delete this payment?')) return;
    try {
      await authAxios.delete(`/vendor/weddings/${wedding.id}/payments/${id}`);
      await loadBudget();
    } catch (error) {
      console.error("Failed to delete payment:", error);
      window.alert(error.response?.data?.detail || 'Could not delete payment.');
    }
  };

  const updateWeddingBudget = async (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0 || budgetSaving) return;
    setBudgetSaving(true);
    try {
      const response = await authAxios.put(
        `/vendor/weddings/${wedding.id}/budget`,
        { total_budget: amount }
      );
      setBudgetData({
        budget: response.data?.budget || budgetData.budget,
        expenses: response.data?.expenses || budgetData.expenses,
        payments: response.data?.payments || budgetData.payments,
      });
    } catch (error) {
      console.error("Failed to update wedding budget:", error);
      window.alert(error.response?.data?.detail || 'Could not update budget.');
    } finally {
      setBudgetSaving(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Date not set';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const vendorCategory = String(vendor?.category || '').trim().toLowerCase();

  // Decorator-only workspace modules.
  // Support the category names currently used across the vendor system.
  const isDecorator =
    vendorCategory === 'wedding decorator' ||
    vendorCategory === 'wedding decor' ||
    vendorCategory === 'decorator' ||
    vendorCategory === 'decor';

  const modules = [
    { title: 'Overview', description: 'Wedding details, timeline and important information', icon: Heart },
    { title: 'Tasks', description: 'Plan and track everything that needs to be done', icon: CheckSquare },
    { title: 'Clients', description: 'Manage bride, groom and client communication', icon: Users },
    { title: 'Budget & Payments', description: 'Track budget, expenses, advances and payments', icon: Wallet },
    { title: 'Documents', description: 'Keep contracts, bills and important files organized', icon: FileText },
    { title: 'Notifications', description: 'Important reminders and wedding updates', icon: Bell },
    { title: 'AI Assistant', description: 'Get AI-powered help for this wedding', icon: Sparkles },
    ...(isDecorator
      ? [
          { title: 'Design', description: 'Manage wedding design concepts, themes and visual direction', icon: Sparkles },
          { title: 'Elements', description: 'Manage decor elements, materials and design requirements', icon: FileText },
        ]
      : []),
  ];

  const budget = budgetData.budget || {};

  return (
    <div className="min-h-screen bg-[#fcf9ff] px-4 py-6 md:px-8 text-[#2D2638]">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={onBack}
          type="button"
          className="flex items-center gap-2 text-[#8B8194] hover:text-[#2D2638] transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Weddings
        </button>

        {/* Wedding Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-[#eadff2] bg-white/80 shadow-[0_20px_60px_rgba(190,160,210,0.12)] backdrop-blur-xl p-6 md:p-8 mb-6">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-pink-400/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-purple-400/10 blur-3xl" />

          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f6efff] text-xs text-[#8B8194] mb-4">
                  <Heart className="w-3.5 h-3.5" />
                  Wedding Workspace
                </div>

                <h1 className="text-3xl md:text-4xl font-semibold text-[#2D2638]">
                  {wedding.wedding_name || 'Untitled Wedding'}
                </h1>

                <p className="text-[#6B6175] mt-2">
                  {wedding.bride_name || 'Bride'}{' '}
                  <span className="text-pink-300">&</span>{' '}
                  {wedding.groom_name || 'Groom'}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl bg-[#faf7ff] border border-white/10 px-4 py-3">
                  <div className="flex items-center gap-2 text-[#8B8194] text-xs">
                    <CalendarDays className="w-4 h-4" />
                    Wedding Date
                  </div>
                  <p className="text-[#3F3748] mt-1 font-medium">
                    {formatDate(wedding.wedding_date)}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#faf7ff] border border-white/10 px-4 py-3">
                  <div className="flex items-center gap-2 text-[#8B8194] text-xs">
                    <MapPin className="w-4 h-4" />
                    Location
                  </div>
                  <p className="text-[#3F3748] mt-1 font-medium">
                    {wedding.city || 'Location not set'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
              <div className="rounded-2xl bg-white/80 border border-white/10 p-4">
                <p className="text-xs text-[#8B8194]">Guests</p>
                <p className="text-xl font-semibold text-[#3F3748] mt-1">
                  {wedding.guest_count || '—'}
                </p>
              </div>

              <div className="rounded-2xl bg-white/80 border border-[#eadff2] p-4">
                <p className="text-xs text-[#8B8194]">Budget</p>
                <p className="text-xl font-semibold text-[#3F3748] mt-1">
                  {formatCurrency(wedding.budget)}
                </p>
              </div>

              <div className="rounded-2xl bg-white/80 border border-[#eadff2] p-4">
                <p className="text-xs text-[#8B8194]">Venue</p>
                <p className="text-sm font-medium text-[#3F3748] mt-1 truncate">
                  {wedding.venue || 'Not set'}
                </p>
              </div>

              <div className="rounded-2xl bg-white/80 border border-white/10 p-4">
                <p className="text-xs text-[#8B8194]">Status</p>
                <p className="text-sm font-medium text-[#3F3748] mt-1 capitalize">
                  {(wedding.status || 'upcoming').replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Modules */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-[#2D2638]">
            Wedding Management
          </h2>
          <p className="text-[#6B6175] text-sm mt-1">
            Everything you need to manage this wedding in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => {
            const Icon = module.icon;

            return (
              <button
                key={module.title}
                type="button"
                onClick={() => {
                  setActiveModule(module.title);
                  setTimeout(() => {
                    document.getElementById("wedding-module")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start"
                    });
                  }, 100);
                }}
                className="group text-left rounded-2xl border border-[#eadff2] bg-white/80 hover:bg-white hover:border-[#d9c7e6] shadow-[0_10px_30px_rgba(190,160,210,0.08)] transition-all duration-200 p-5"
              >
                <div className="w-11 h-11 rounded-xl bg-[#f4eafa] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5 text-[#8B6AA8]" />
                </div>
                <h3 className="text-[#2D2638] font-medium">{module.title}</h3>
                <p className="text-[#6B6175] text-sm mt-1 leading-relaxed">
                  {module.description}
                </p>
              </button>
            );
          })}
        </div>

        {activeModule && (
          <div id="wedding-module" className="mt-6 rounded-2xl border border-[#eadff2] bg-white/80 p-6 shadow-[0_10px_30px_rgba(190,160,210,0.08)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#2D2638]">
                {activeModule}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModule(null)}
                className="text-sm text-[#8B6AA8] hover:text-[#6B4F82]"
              >
                Back
              </button>
            </div>
            
            <p className="mt-2 text-sm text-[#6B6175]">
              {activeModule === "Tasks"
                ? "Manage and track everything that needs to be done for this wedding."
                : activeModule === "Clients"
                ? "Manage client details and communication for this wedding."
                : activeModule === "Budget & Payments"
                ? "Track budget, expenses, advances and payments for this wedding."
                : activeModule === "Documents"
                ? "Keep contracts, bills and important files organized for this wedding."
                : "Wedding overview and important details."}
            </p>

            {/* TASKS MODULE */}
            {activeModule === "Tasks" && (
              <>
                <div className="mt-4 mb-5 rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#8B8194]">Task Management</p>
                      <h4 className="text-lg font-semibold text-[#3F3748] mt-1">
                        Wedding Tasks
                      </h4>
                      <p className="text-sm text-[#6B6175] mt-1">
                        Create, organize and track tasks for this wedding.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowTaskForm(true)}
                      className="rounded-xl bg-[#f4eafa] px-4 py-2 text-sm font-medium text-[#8B6AA8] hover:bg-[#eadcf5]"
                    >
                      + Add Task
                    </button>
                  </div>
                </div>

                {showTaskForm && (
                  <div className="mb-5 rounded-xl border border-[#eadff2] bg-white p-5">
                    <p className="text-sm font-medium text-[#3F3748] mb-2">New Task</p>
                    <input
                      type="text"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="Enter task name"
                      className="w-full rounded-xl border border-[#eadff2] bg-[#faf7ff] px-4 py-3 text-sm text-[#3F3748] outline-none focus:border-[#c9a9df]"
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (!taskTitle.trim()) return;
                          if (editingTaskIndex !== null) {
                            setTasks(
                              tasks.map((item, index) =>
                                index === editingTaskIndex
                                  ? { ...item, title: taskTitle }
                                  : item
                              )
                            );
                            setEditingTaskIndex(null);
                          } else {
                            setTasks([...tasks, { title: taskTitle, completed: false }]);
                          }
                          setTaskTitle("");
                          setShowTaskForm(false);
                        }}
                        className="rounded-xl bg-[#f4eafa] px-4 py-2 text-sm font-medium text-[#8B6AA8]"
                      >
                        {editingTaskIndex !== null ? "Update Task" : "Save Task"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowTaskForm(false)}
                        className="rounded-xl px-4 py-2 text-sm text-[#8B8194]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {tasks.length > 0 && (
                  <div className="mb-5 rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                    <p className="text-sm text-[#8B8194]">Your Tasks</p>
                    <div className="mt-3 space-y-2">
                      {tasks.map((task, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 rounded-lg border border-[#eadff2] bg-white px-4 py-3"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setTasks(
                                tasks.map((item, i) =>
                                  i === index ? { ...item, completed: !item.completed } : item
                                )
                              );
                            }}
                            className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                              task.completed
                                ? "bg-[#8B6AA8] border-[#8B6AA8] text-white"
                                : "border-[#c9b8d8] bg-white"
                            }`}
                          >
                            {task.completed ? "✓" : ""}
                          </button>
                          <span className={`text-sm ${task.completed ? "text-[#9B91A3] line-through" : "text-[#3F3748]"}`}>
                            {task.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTaskIndex(index);
                              setTaskTitle(task.title);
                              setShowTaskForm(true);
                            }}
                            className="ml-auto rounded-lg bg-[#f4eafa] px-3 py-1 text-sm text-[#8B6AA8]"
                          >
                            Edit
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* CLIENTS MODULE */}
            {activeModule === "Clients" && (
              <div className="mt-4 mb-5 rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#8B8194]">Client Management</p>
                    <h4 className="text-lg font-semibold text-[#3F3748] mt-1">
                      Wedding Clients
                    </h4>
                    <p className="text-sm text-[#6B6175] mt-1">
                      Manage client details and communication for this wedding.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      resetClientForm();
                      setShowClientForm(true);
                    }}
                    className="rounded-xl bg-[#f4eafa] px-4 py-2 text-sm font-medium text-[#8B6AA8] hover:bg-[#eadff5]"
                  >
                    + Add Client
                  </button>
                </div>

                {showClientForm && (
                  <div className="mt-5 rounded-xl border border-[#eadff2] bg-white p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client Name *" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                      <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="Phone" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                      <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="Email" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                      <input value={clientRelation} onChange={(e) => setClientRelation(e.target.value)} placeholder="Relation (Bride / Groom / Family)" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                      <textarea value={clientNotes} onChange={(e) => setClientNotes(e.target.value)} placeholder="Notes" rows="3" className="md:col-span-2 rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button type="button" onClick={editingClientId ? updateClient : saveClient} disabled={savingClient} className="rounded-xl bg-[#8B6AA8] px-4 py-2 text-sm font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed">
                        {savingClient ? "Saving..." : editingClientId ? "Update Client" : "Save Client"}
                      </button>
                      <button type="button" onClick={resetClientForm} className="rounded-xl px-4 py-2 text-sm text-[#8B8194]">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {clients.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {clients.map((client) => (
                      <div key={client.id} className="rounded-xl border border-[#eadff2] bg-white p-4">
                        <p className="font-medium text-[#3F3748]">{client.name}</p>
                        <div className="mt-1 text-sm text-[#6B6175] space-y-1">
                          {client.phone && <p>Phone: {client.phone}</p>}
                          {client.email && <p>Email: {client.email}</p>}
                          {client.relation && <p>Relation: {client.relation}</p>}
                          {client.notes && <p>Notes: {client.notes}</p>}
                        </div>
                        <div className="mt-3">
                          <button type="button" onClick={() => {
                            setEditingClientId(client.id);
                            setClientName(client.name || "");
                            setClientPhone(client.phone || "");
                            setClientEmail(client.email || "");
                            setClientRelation(client.relation || "");
                            setClientNotes(client.notes || "");
                            setShowClientForm(true);
                          }} className="rounded-xl bg-[#f4eafa] px-4 py-2 text-sm font-medium text-[#8B6AA8] hover:bg-[#eadff5]">
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* OVERVIEW MODULE */}
            {activeModule === "Overview" && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4"><p className="text-xs text-[#8B8194]">Bride</p><p className="text-sm font-medium text-[#3F3748] mt-1">{wedding.bride_name || "Not added"}</p></div>
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4"><p className="text-xs text-[#8B8194]">Groom</p><p className="text-sm font-medium text-[#3F3748] mt-1">{wedding.groom_name || "Not added"}</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4"><p className="text-xs text-[#8B8194]">Wedding Date</p><p className="text-sm font-medium text-[#3F3748] mt-1">{formatDate(wedding.wedding_date)}</p></div>
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4"><p className="text-xs text-[#8B8194]">Venue & Location</p><p className="text-sm font-medium text-[#3F3748] mt-1">{wedding.venue || "Venue not added"}{wedding.city ? `, ${wedding.city}` : ""}</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4"><p className="text-xs text-[#8B8194]">Guest Count</p><p className="text-sm font-medium text-[#3F3748] mt-1">{wedding.guest_count || "Not added"}</p></div>
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4"><p className="text-xs text-[#8B8194]">Budget</p><p className="text-sm font-medium text-[#3F3748] mt-1">{formatCurrency(wedding.budget)}</p></div>
                </div>
              </div>
            )}

            {/* BUDGET & PAYMENTS MODULE */}
            {activeModule === "Budget & Payments" && (
              <div className="mt-4 space-y-5">
                <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-sm text-[#8B8194]">Financial Management</p>
                      <h4 className="text-lg font-semibold text-[#3F3748] mt-1">Wedding Budget</h4>
                      <p className="text-sm text-[#6B6175] mt-1">Track your planned budget, expenses and client payments.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[#8B8194]">Total Budget</label>
                      <input
                        type="number"
                        min="0"
                        defaultValue={budget.total_budget || 0}
                        key={budget.total_budget}
                        onBlur={(e) => updateWeddingBudget(e.target.value)}
                        className="w-40 rounded-xl border border-[#eadff2] bg-white px-3 py-2 text-sm text-[#3F3748] outline-none focus:border-[#c9a9df]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4"><p className="text-xs text-[#8B8194]">Total Budget</p><p className="text-xl font-semibold text-[#3F3748] mt-1">{formatCurrency(budget.total_budget)}</p></div>
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4"><p className="text-xs text-[#8B8194]">Expenses</p><p className="text-xl font-semibold text-[#3F3748] mt-1">{formatCurrency(budget.total_expenses)}</p></div>
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4"><p className="text-xs text-[#8B8194]">Payments Received</p><p className="text-xl font-semibold text-[#3F3748] mt-1">{formatCurrency(budget.total_payments)}</p></div>
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4"><p className="text-xs text-[#8B8194]">Remaining Budget</p><p className="text-xl font-semibold text-[#3F3748] mt-1">{formatCurrency(budget.remaining_budget)}</p></div>
                </div>

                {budgetLoading ? (
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-8 text-center text-sm text-[#8B8194]">Loading budget...</div>
                ) : (
                  <>
                    <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div><p className="text-sm text-[#8B8194]">Expense Management</p><h4 className="text-lg font-semibold text-[#3F3748] mt-1">Wedding Expenses</h4></div>
                        <button type="button" onClick={() => { resetExpenseForm(); setShowExpenseForm(true); }} className="rounded-xl bg-[#f4eafa] px-4 py-2 text-sm font-medium text-[#8B6AA8] hover:bg-[#eadcf5]"><Plus className="inline w-4 h-4 mr-1" />Add Expense</button>
                      </div>

                      {showExpenseForm && (
                        <div className="mt-4 rounded-xl border border-[#eadff2] bg-white p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input value={expenseForm.title} onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })} placeholder="Expense title *" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                            <input type="number" min="0" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} placeholder="Amount *" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                            <select value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none bg-white"><option>General</option><option>Venue</option><option>Decor</option><option>Catering</option><option>Photography</option><option>Entertainment</option><option>Transport</option><option>Accommodation</option><option>Invitations</option><option>Other</option></select>
                            <input type="date" value={expenseForm.expense_date} onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                            <textarea value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} placeholder="Notes" rows="2" className="md:col-span-2 rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                          </div>
                          <div className="flex gap-2 mt-4"><button type="button" onClick={saveExpense} disabled={budgetSaving} className="rounded-xl bg-[#8B6AA8] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{budgetSaving ? 'Saving...' : editingExpenseId ? 'Update Expense' : 'Save Expense'}</button><button type="button" onClick={resetExpenseForm} className="rounded-xl px-4 py-2 text-sm text-[#8B8194]">Cancel</button></div>
                        </div>
                      )}

                      {budgetData.expenses.length > 0 ? (
                        <div className="mt-4 space-y-2">
                          {budgetData.expenses.map((expense) => (
                            <div key={expense.id} className="flex flex-col md:flex-row md:items-center gap-3 rounded-lg border border-[#eadff2] bg-white px-4 py-3">
                              <div className="flex-1"><p className="text-sm font-medium text-[#3F3748]">{expense.title}</p><p className="text-xs text-[#8B8194] mt-1">{expense.category}{expense.expense_date ? ` • ${expense.expense_date}` : ''}{expense.notes ? ` • ${expense.notes}` : ''}</p></div>
                              <p className="text-sm font-semibold text-[#3F3748]">{formatCurrency(expense.amount)}</p>
                              <button type="button" onClick={() => { setEditingExpenseId(expense.id); setExpenseForm({ title: expense.title || '', category: expense.category || 'General', amount: expense.amount || '', expense_date: expense.expense_date || '', notes: expense.notes || '' }); setShowExpenseForm(true); }} className="rounded-lg bg-[#f4eafa] px-3 py-1 text-sm text-[#8B6AA8]"><Edit3 className="inline w-3.5 h-3.5 mr-1" />Edit</button>
                              <button type="button" onClick={() => deleteExpense(expense.id)} className="rounded-lg bg-[#fff1f4] px-3 py-1 text-sm text-red-400"><Trash2 className="inline w-3.5 h-3.5 mr-1" />Delete</button>
                            </div>
                          ))}
                        </div>
                      ) : <p className="mt-4 text-sm text-[#8B8194]">No expenses added yet.</p>}
                    </div>

                    <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div><p className="text-sm text-[#8B8194]">Payment Management</p><h4 className="text-lg font-semibold text-[#3F3748] mt-1">Advances & Payments</h4></div>
                        <button type="button" onClick={() => { resetPaymentForm(); setShowPaymentForm(true); }} className="rounded-xl bg-[#f4eafa] px-4 py-2 text-sm font-medium text-[#8B6AA8] hover:bg-[#eadcf5]"><Plus className="inline w-4 h-4 mr-1" />Add Payment</button>
                      </div>

                      {showPaymentForm && (
                        <div className="mt-4 rounded-xl border border-[#eadff2] bg-white p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input value={paymentForm.title} onChange={(e) => setPaymentForm({ ...paymentForm, title: e.target.value })} placeholder="Payment title *" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                            <input type="number" min="0" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder="Amount *" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                            <select value={paymentForm.payment_type} onChange={(e) => setPaymentForm({ ...paymentForm, payment_type: e.target.value })} className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none bg-white"><option value="advance">Advance</option><option value="payment">Payment</option><option value="refund">Refund</option></select>
                            <input type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                            <textarea value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} placeholder="Notes" rows="2" className="md:col-span-2 rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                          </div>
                          <div className="flex gap-2 mt-4"><button type="button" onClick={savePayment} disabled={budgetSaving} className="rounded-xl bg-[#8B6AA8] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{budgetSaving ? 'Saving...' : editingPaymentId ? 'Update Payment' : 'Save Payment'}</button><button type="button" onClick={resetPaymentForm} className="rounded-xl px-4 py-2 text-sm text-[#8B8194]">Cancel</button></div>
                        </div>
                      )}

                      {budgetData.payments.length > 0 ? (
                        <div className="mt-4 space-y-2">
                          {budgetData.payments.map((payment) => (
                            <div key={payment.id} className="flex flex-col md:flex-row md:items-center gap-3 rounded-lg border border-[#eadff2] bg-white px-4 py-3">
                              <div className="flex-1"><p className="text-sm font-medium text-[#3F3748]">{payment.title}</p><p className="text-xs text-[#8B8194] mt-1 capitalize">{payment.payment_type}{payment.payment_date ? ` • ${payment.payment_date}` : ''}{payment.notes ? ` • ${payment.notes}` : ''}</p></div>
                              <p className={`text-sm font-semibold ${payment.payment_type === 'refund' ? 'text-red-400' : 'text-[#3F3748]'}`}>{payment.payment_type === 'refund' ? '-' : ''}{formatCurrency(payment.amount)}</p>
                              <button type="button" onClick={() => { setEditingPaymentId(payment.id); setPaymentForm({ title: payment.title || '', payment_type: payment.payment_type || 'payment', amount: payment.amount || '', payment_date: payment.payment_date || '', notes: payment.notes || '' }); setShowPaymentForm(true); }} className="rounded-lg bg-[#f4eafa] px-3 py-1 text-sm text-[#8B6AA8]"><Edit3 className="inline w-3.5 h-3.5 mr-1" />Edit</button>
                              <button type="button" onClick={() => deletePayment(payment.id)} className="rounded-lg bg-[#fff1f4] px-3 py-1 text-sm text-red-400"><Trash2 className="inline w-3.5 h-3.5 mr-1" />Delete</button>
                            </div>
                          ))}
                        </div>
                      ) : <p className="mt-4 text-sm text-[#8B8194]">No payments added yet.</p>}
                    </div>

                    <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                      <div className="flex items-center justify-between"><div><p className="text-sm text-[#8B8194]">Payment Balance</p><h4 className="text-lg font-semibold text-[#3F3748] mt-1">Expense vs. Payments</h4></div><p className="text-lg font-semibold text-[#3F3748]">{formatCurrency(budget.payment_balance)}</p></div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* DOCUMENTS MODULE */}
            {activeModule === "Documents" && (
              <div className="mt-4 space-y-5">
                <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="text-sm text-[#8B8194]">Document Management</p>
                      <h4 className="text-lg font-semibold text-[#3F3748] mt-1">
                        Wedding Documents
                      </h4>
                      <p className="text-sm text-[#6B6175] mt-1">
                        Keep contracts, bills, invoices and important wedding files organized.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        resetDocumentForm();
                        setShowDocumentForm(true);
                      }}
                      className="rounded-xl bg-[#f4eafa] px-4 py-2 text-sm font-medium text-[#8B6AA8] hover:bg-[#eadcf5]"
                    >
                      <Plus className="inline w-4 h-4 mr-1" />
                      Add Document
                    </button>
                  </div>
                </div>

                {showDocumentForm && (
                  <div className="rounded-xl border border-[#eadff2] bg-white p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        value={documentTitle}
                        onChange={(e) => setDocumentTitle(e.target.value)}
                        placeholder="Document title"
                        className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none focus:border-[#c9a9df]"
                      />

                      <select
                        value={documentCategory}
                        onChange={(e) => setDocumentCategory(e.target.value)}
                        className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none bg-white"
                      >
                        <option>General</option>
                        <option>Contract</option>
                        <option>Invoice</option>
                        <option>Bill</option>
                        <option>Venue</option>
                        <option>Catering</option>
                        <option>Photography</option>
                        <option>Decor</option>
                        <option>Guest List</option>
                        <option>Invitation</option>
                        <option>Other</option>
                      </select>

                      {!documentEditingId && (
                        <div className="md:col-span-2">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.webp"
                            onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                            className="w-full rounded-lg border border-[#eadff2] bg-[#faf7ff] px-3 py-2 text-sm text-[#3F3748] outline-none"
                          />
                          <p className="text-xs text-[#8B8194] mt-2">
                            PDF, Word, Excel, CSV, TXT and image files up to 10 MB.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        type="button"
                        onClick={saveDocument}
                        disabled={documentUploading || (!documentEditingId && !documentFile)}
                        className="rounded-xl bg-[#8B6AA8] px-4 py-2 text-sm font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {documentUploading
                          ? documentEditingId
                            ? 'Saving...'
                            : 'Uploading...'
                          : documentEditingId
                          ? 'Update Document'
                          : 'Upload Document'}
                      </button>

                      <button
                        type="button"
                        onClick={resetDocumentForm}
                        className="rounded-xl px-4 py-2 text-sm text-[#8B8194]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#8B8194]">Your Files</p>
                      <h4 className="text-lg font-semibold text-[#3F3748] mt-1">
                        Saved Documents
                      </h4>
                    </div>
                    <p className="text-sm text-[#8B8194]">
                      {documents.length} {documents.length === 1 ? 'document' : 'documents'}
                    </p>
                  </div>

                  {documentsLoading ? (
                    <div className="mt-4 rounded-lg border border-[#eadff2] bg-white p-6 text-center text-sm text-[#8B8194]">
                      Loading documents...
                    </div>
                  ) : documents.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      {documents.map((document) => (
                        <div
                          key={document.id}
                          className="flex flex-col md:flex-row md:items-center gap-3 rounded-lg border border-[#eadff2] bg-white px-4 py-3"
                        >
                          <div className="w-10 h-10 rounded-xl bg-[#f4eafa] flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-[#8B6AA8]" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#3F3748] truncate">
                              {document.title || document.file_name || 'Document'}
                            </p>
                            <p className="text-xs text-[#8B8194] mt-1">
                              {document.category || 'General'}
                              {document.file_name ? ` • ${document.file_name}` : ''}
                              {document.file_size ? ` • ${formatFileSize(document.file_size)}` : ''}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => downloadDocument(document)}
                              className="rounded-lg bg-[#f4eafa] px-3 py-1 text-sm text-[#8B6AA8]"
                            >
                              <Download className="inline w-3.5 h-3.5 mr-1" />
                              Download
                            </button>

                            <button
                              type="button"
                              onClick={() => editDocument(document)}
                              className="rounded-lg bg-[#f4eafa] px-3 py-1 text-sm text-[#8B6AA8]"
                            >
                              <Edit3 className="inline w-3.5 h-3.5 mr-1" />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteDocument(document.id)}
                              className="rounded-lg bg-[#fff1f4] px-3 py-1 text-sm text-red-400"
                            >
                              <Trash2 className="inline w-3.5 h-3.5 mr-1" />
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-[#8B8194]">
                      No documents added yet.
                    </p>
                  )}
                </div>
              </div>
            )}
            {activeModule === "Notifications" && (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-sm text-[#8B8194]">Notifications</p>
                      <h4 className="text-lg font-semibold text-[#3F3748] mt-1">Wedding Notifications</h4>
                      <p className="text-sm text-[#6B6175] mt-1">Keep important reminders and wedding updates in one place.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {notificationsUnreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllNotificationsRead}
                          className="rounded-xl bg-white border border-[#eadff2] px-4 py-2 text-sm font-medium text-[#8B6AA8] hover:bg-[#f4eafa]"
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          resetNotificationForm();
                          setShowNotificationForm(true);
                        }}
                        className="rounded-xl bg-[#f4eafa] px-4 py-2 text-sm font-medium text-[#8B6AA8] hover:bg-[#eadcf5]"
                      >
                        <Plus className="inline w-4 h-4 mr-1" />
                        Add Notification
                      </button>
                    </div>
                  </div>
                </div>

                {showNotificationForm && (
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                    <p className="text-sm font-medium text-[#3F3748]">New Wedding Notification</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <input
                        value={notificationTitle}
                        onChange={(e) => setNotificationTitle(e.target.value)}
                        placeholder="Notification title *"
                        className="rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a9df]"
                      />
                      <select
                        value={notificationType}
                        onChange={(e) => setNotificationType(e.target.value)}
                        className="rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none"
                      >
                        <option value="reminder">Reminder</option>
                        <option value="payment">Payment</option>
                        <option value="budget">Budget</option>
                        <option value="document">Document</option>
                        <option value="update">Update</option>
                        <option value="system">System</option>
                      </select>
                      <select
                        value={notificationPriority}
                        onChange={(e) => setNotificationPriority(e.target.value)}
                        className="rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none"
                      >
                        <option value="low">Low priority</option>
                        <option value="normal">Normal priority</option>
                        <option value="high">High priority</option>
                      </select>
                      <input
                        type="date"
                        value={notificationReminderDate}
                        onChange={(e) => setNotificationReminderDate(e.target.value)}
                        className="rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none"
                      />
                      <textarea
                        value={notificationMessage}
                        onChange={(e) => setNotificationMessage(e.target.value)}
                        placeholder="Message"
                        rows="3"
                        className="md:col-span-2 rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a9df]"
                      />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        type="button"
                        onClick={saveNotification}
                        disabled={notificationSaving}
                        className="rounded-xl bg-[#8B6AA8] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                      >
                        {notificationSaving ? 'Saving...' : 'Save Notification'}
                      </button>
                      <button
                        type="button"
                        onClick={resetNotificationForm}
                        className="rounded-xl px-4 py-2 text-sm text-[#8B8194]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#8B8194]">Your Updates</p>
                      <h4 className="text-lg font-semibold text-[#3F3748] mt-1">Wedding Reminders</h4>
                    </div>
                    <span className="text-sm text-[#8B8194]">
                      {notificationsUnreadCount} unread
                    </span>
                  </div>

                  {notificationsLoading ? (
                    <div className="mt-4 rounded-xl border border-[#eadff2] bg-white p-8 text-center text-sm text-[#8B8194]">
                      Loading notifications...
                    </div>
                  ) : notifications.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`rounded-xl border border-[#eadff2] bg-white p-4 ${notification.read ? '' : 'shadow-[0_8px_25px_rgba(190,160,210,0.10)]'}`}
                        >
                          <div className="flex flex-col md:flex-row md:items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${notification.read ? 'bg-[#f6efff] text-[#9B91A3]' : 'bg-[#f4eafa] text-[#8B6AA8]'}`}>
                              <Bell className="w-4 h-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className={`text-sm font-semibold ${notification.read ? 'text-[#6B6175]' : 'text-[#3F3748]'}`}>
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <span className="rounded-full bg-[#f4eafa] px-2 py-0.5 text-[11px] text-[#8B6AA8]">New</span>
                                )}
                                <span className="rounded-full bg-[#faf7ff] px-2 py-0.5 text-[11px] text-[#8B8194] capitalize">
                                  {notification.notification_type || 'reminder'}
                                </span>
                                {notification.priority === 'high' && (
                                  <span className="rounded-full bg-[#fff1f4] px-2 py-0.5 text-[11px] text-red-400">High</span>
                                )}
                              </div>

                              {notification.message && (
                                <p className="text-sm text-[#6B6175] mt-1">{notification.message}</p>
                              )}

                              <div className="flex flex-wrap gap-3 mt-2 text-xs text-[#8B8194]">
                                {notification.reminder_date && <span>Reminder: {notification.reminder_date}</span>}
                                {notification.created_at && <span>Created: {formatDate(notification.created_at)}</span>}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 md:justify-end">
                              <button
                                type="button"
                                onClick={() => toggleNotificationRead(notification)}
                                className="rounded-lg bg-[#f4eafa] px-3 py-1 text-sm text-[#8B6AA8]"
                              >
                                {notification.read ? 'Mark unread' : 'Mark read'}
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteNotification(notification.id)}
                                className="rounded-lg bg-[#fff1f4] px-3 py-1 text-sm text-red-400"
                              >
                                <Trash2 className="inline w-3.5 h-3.5 mr-1" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-[#eadff2] bg-white p-8 text-center">
                      <Bell className="w-7 h-7 mx-auto text-[#b39bc6]" />
                      <p className="text-sm font-medium text-[#3F3748] mt-3">No notifications yet</p>
                      <p className="text-sm text-[#8B8194] mt-1">Important wedding reminders and updates will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeModule === "AI Assistant" && (
              <div className="mt-4 rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5"><p className="text-sm text-[#8B8194]">AI Assistant</p><h4 className="text-lg font-semibold text-[#3F3748] mt-1">Wedding AI Assistant</h4><p className="text-sm text-[#6B6175] mt-1">Wedding-specific AI assistance will be added next.</p></div>
            )}

            {isDecorator && activeModule === "Design" && (
              <div className="mt-4 space-y-5">
                <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-sm text-[#8B8194]">Design Management</p>
                      <h4 className="text-lg font-semibold text-[#3F3748] mt-1">Wedding Design</h4>
                      <p className="text-sm text-[#6B6175] mt-1">Manage the complete visual direction, theme and decor concept for this wedding.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={designData.status}
                        onChange={(e) => setDesignData({ ...designData, status: e.target.value })}
                        className="rounded-xl border border-[#eadff2] bg-white px-3 py-2 text-sm text-[#3F3748] outline-none"
                      >
                        <option value="draft">Draft</option>
                        <option value="in_progress">In Progress</option>
                        <option value="approved">Approved</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button type="button" onClick={saveDesign} disabled={designSaving || designLoading} className="rounded-xl bg-[#8B6AA8] px-4 py-2 text-sm font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed">
                        {designSaving ? 'Saving...' : 'Save Design'}
                      </button>
                      <button type="button" onClick={deleteDesign} disabled={designDeleting || designLoading} className="rounded-xl bg-[#fff1f4] px-4 py-2 text-sm font-medium text-red-400 disabled:opacity-60 disabled:cursor-not-allowed">
                        <Trash2 className="inline w-4 h-4 mr-1" />
                        {designDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>

                {designLoading ? (
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-8 text-center text-sm text-[#8B8194]">Loading design...</div>
                ) : (
                  <>
                    <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                      <p className="text-sm text-[#8B8194]">Core Concept</p>
                      <h4 className="text-lg font-semibold text-[#3F3748] mt-1">Theme & Creative Direction</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <input value={designData.theme} onChange={(e) => setDesignData({ ...designData, theme: e.target.value })} placeholder="Theme name" className="rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a9df]" />
                        <input value={designData.concept} onChange={(e) => setDesignData({ ...designData, concept: e.target.value })} placeholder="Design concept / creative direction" className="rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a9df]" />
                      </div>
                      <div className="mt-5">
                        <div className="flex items-center justify-between gap-3">
                          <div><p className="text-sm font-medium text-[#3F3748]">Color Palette</p><p className="text-xs text-[#8B8194] mt-1">Add up to 12 colors for the wedding design.</p></div>
                          <button type="button" onClick={addDesignPaletteColor} disabled={(designData.palette || []).length >= 12} className="rounded-xl bg-[#f4eafa] px-3 py-2 text-sm text-[#8B6AA8] disabled:opacity-50">+ Add Color</button>
                        </div>
                        {(designData.palette || []).length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                            {designData.palette.map((color, index) => (
                              <div key={`${index}-${color}`} className="flex items-center gap-2 rounded-lg border border-[#eadff2] bg-white p-2">
                                <input type="color" value={/^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#8B6AA8'} onChange={(e) => updateDesignPaletteColor(index, e.target.value)} className="w-9 h-9 rounded-md border-0 bg-transparent cursor-pointer" />
                                <input value={color} onChange={(e) => updateDesignPaletteColor(index, e.target.value)} placeholder="#HEX" className="min-w-0 flex-1 rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                                <button type="button" onClick={() => removeDesignPaletteColor(index)} className="rounded-lg bg-[#fff1f4] px-2 py-2 text-red-400" aria-label="Remove color">×</button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 text-sm text-[#8B8194]">No colors added yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                      <p className="text-sm text-[#8B8194]">Decor Direction</p>
                      <h4 className="text-lg font-semibold text-[#3F3748] mt-1">Wedding Design Areas</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {[["mandap","Mandap Design","Describe the mandap structure, backdrop, florals and styling"],["stage","Stage Design","Describe the stage, backdrop and focal styling"],["entrance","Entrance Design","Describe the entry gate, signage and arrival experience"],["table_decor","Table / Decor Design","Describe tablescape, centerpieces and guest-area decor"],["lighting","Lighting Concept","Describe chandeliers, washes, fairy lights, spotlights and ambience"],["florals","Floral Direction","Describe flowers, arrangements, colors and placement"]].map(([key,label,placeholder]) => (
                          <div key={key}>
                            <label className="text-sm font-medium text-[#3F3748]">{label}</label>
                            <textarea value={designData[key]} onChange={(e) => setDesignData({ ...designData, [key]: e.target.value })} placeholder={placeholder} rows="4" className="mt-2 w-full rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a9df]" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                      <p className="text-sm text-[#8B8194]">Creative Notes</p>
                      <h4 className="text-lg font-semibold text-[#3F3748] mt-1">Design Notes</h4>
                      <textarea value={designData.notes} onChange={(e) => setDesignData({ ...designData, notes: e.target.value })} placeholder="Add client preferences, execution notes, do-not-use details, venue restrictions or other creative instructions." rows="5" className="mt-4 w-full rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a9df]" />
                    </div>

                    <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                      <p className="text-sm text-[#8B8194]">Visual References</p>
                      <h4 className="text-lg font-semibold text-[#3F3748] mt-1">Reference Images</h4>
                      <p className="text-sm text-[#6B6175] mt-1">Add image URLs for design references. Up to 20 references can be saved.</p>
                      <div className="flex flex-col sm:flex-row gap-2 mt-4">
                        <input value={designReferenceUrl} onChange={(e) => setDesignReferenceUrl(e.target.value)} placeholder="Paste image URL" className="flex-1 rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a9df]" />
                        <button type="button" onClick={addDesignReference} disabled={!designReferenceUrl.trim() || (designData.reference_images || []).length >= 20} className="rounded-xl bg-[#f4eafa] px-4 py-2 text-sm font-medium text-[#8B6AA8] disabled:opacity-50">+ Add Reference</button>
                      </div>
                      {(designData.reference_images || []).length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                          {designData.reference_images.map((url, index) => (
                            <div key={`${index}-${url}`} className="rounded-xl border border-[#eadff2] bg-white overflow-hidden">
                              <div className="aspect-video bg-[#f6efff]">
                                <img src={url} alt={`Design reference ${index + 1}`} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                              </div>
                              <div className="p-3">
                                <p className="text-xs text-[#8B8194] truncate" title={url}>{url}</p>
                                <button type="button" onClick={() => removeDesignReference(index)} className="mt-2 rounded-lg bg-[#fff1f4] px-3 py-1 text-sm text-red-400">Remove</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button type="button" onClick={saveDesign} disabled={designSaving} className="rounded-xl bg-[#8B6AA8] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60">
                        {designSaving ? 'Saving Design...' : 'Save Design'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {isDecorator && activeModule === "Elements" && (
              <div className="mt-4 space-y-5">
                <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="text-sm text-[#8B8194]">Element Management</p>
                      <h4 className="text-lg font-semibold text-[#3F3748] mt-1">Wedding Elements</h4>
                      <p className="text-sm text-[#6B6175] mt-1">Manage decor elements, materials, quantities and execution requirements for this wedding.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { resetElementForm(); setShowElementForm(true); }}
                      className="rounded-xl bg-[#f4eafa] px-4 py-2 text-sm font-medium text-[#8B6AA8] hover:bg-[#eadcf5]"
                    >
                      <Plus className="inline w-4 h-4 mr-1" />
                      Add Element
                    </button>
                  </div>
                </div>

                {showElementForm && (
                  <div className="rounded-xl border border-[#eadff2] bg-white p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-[#8B8194]">{editingElementId ? 'Edit Element' : 'New Element'}</p>
                        <h4 className="text-lg font-semibold text-[#3F3748] mt-1">Element Details</h4>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        value={elementForm.name}
                        onChange={(e) => setElementForm({ ...elementForm, name: e.target.value })}
                        placeholder="Element name *"
                        className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none focus:border-[#c9a9df]"
                      />
                      <select
                        value={elementForm.category}
                        onChange={(e) => {
                          const value = e.target.value;
                          setElementForm({ ...elementForm, category: value });
                          if (value !== 'Custom') setCustomCategoryName('');
                        }}
                        className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none bg-white"
                      >
                        {DECORATOR_ELEMENT_CATEGORIES.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                        {customElementCategories.map((category) => (
                          <option key={category.id} value={category.name}>{category.name}</option>
                        ))}
                        {elementForm.category &&
                          !DECORATOR_ELEMENT_CATEGORIES.includes(elementForm.category) &&
                          !customElementCategories.some((category) => category.name === elementForm.category) && (
                            <option value={elementForm.category}>{elementForm.category}</option>
                          )}
                      </select>
                      {elementForm.category === 'General' && (
                        <div className="md:col-span-2 rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-[#3F3748]">Common Decor Items</p>
                              <p className="text-xs text-[#8B8194] mt-1">Quickly select a commonly used item or type your own below.</p>
                            </div>
                          </div>
                          <select
                            defaultValue=""
                            onChange={(e) => { selectCommonElement(e.target.value); e.target.value = ''; }}
                            className="mt-3 w-full rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a9df]"
                          >
                            <option value="">Select a common item...</option>
                            {COMMON_DECOR_ITEMS.map((item) => <option key={item} value={item}>{item}</option>)}
                          </select>
                        </div>
                      )}

                      {elementForm.category === 'Custom' && (
                        <div className="md:col-span-2 rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4">
                          <p className="text-sm font-medium text-[#3F3748]">Custom Category</p>
                          <p className="text-xs text-[#8B8194] mt-1">Create your own category for the way you manage decor.</p>
                          <div className="flex flex-col md:flex-row gap-2 mt-3">
                            <input
                              value={customCategoryName}
                              onChange={(e) => setCustomCategoryName(e.target.value)}
                              placeholder="e.g. Wooden Structures"
                              className="flex-1 rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a9df]"
                            />
                            <button
                              type="button"
                              onClick={saveElementCategory}
                              disabled={!customCategoryName.trim() || customCategorySaving}
                              className="rounded-xl bg-[#f4eafa] px-4 py-2 text-sm font-medium text-[#8B6AA8] disabled:opacity-50"
                            >
                              {customCategorySaving ? 'Saving...' : 'Save Category'}
                            </button>
                          </div>
                          <label className="flex items-center gap-2 mt-3 text-sm text-[#6B6175]">
                            <input
                              type="checkbox"
                              checked={saveCustomCategory}
                              onChange={(e) => setSaveCustomCategory(e.target.checked)}
                              className="rounded border-[#c9b8d8]"
                            />
                            Save this category for future weddings
                          </label>
                          {customElementCategories.length > 0 && (
                            <div className="mt-4">
                              <p className="text-xs text-[#8B8194]">Your saved custom categories</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {customElementCategories.map((category) => (
                                  <div key={category.id} className="inline-flex items-center gap-1 rounded-full bg-white border border-[#eadff2] pl-3 pr-1 py-1">
                                    <button
                                      type="button"
                                      onClick={() => setElementForm((current) => ({ ...current, category: category.name }))}
                                      className="text-xs text-[#8B6AA8]"
                                    >
                                      {category.name}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteElementCategory(category.id, category.name)}
                                      className="w-5 h-5 rounded-full text-[#9B91A3] hover:text-red-400"
                                      aria-label={`Delete ${category.name}`}
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={elementForm.quantity}
                        onChange={(e) => setElementForm({ ...elementForm, quantity: e.target.value })}
                        placeholder="Quantity *"
                        className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none focus:border-[#c9a9df]"
                      />
                      <input
                        value={elementForm.unit}
                        onChange={(e) => setElementForm({ ...elementForm, unit: e.target.value })}
                        placeholder="Unit (pcs, ft, set, etc.)"
                        className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none focus:border-[#c9a9df]"
                      />
                      <div>
                        <input
                          value={elementForm.dimensions}
                          onChange={(e) => setElementForm({ ...elementForm, dimensions: e.target.value })}
                          placeholder="Dimensions / Size (20 × 12, 8 × 4 × 2...)"
                          className="w-full rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none focus:border-[#c9a9df]"
                        />
                        <p className="mt-1 text-xs text-[#8B8194]">Use ×, x or * for dimensions, e.g. 20 × 12 ft.</p>
                      </div>
                      <input
                        value={elementForm.area}
                        onChange={(e) => setElementForm({ ...elementForm, area: e.target.value })}
                        placeholder="Area / Location (Mandap, Stage, Entrance...)"
                        className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none focus:border-[#c9a9df]"
                      />
                      <select
                        value={elementForm.status}
                        onChange={(e) => setElementForm({ ...elementForm, status: e.target.value })}
                        className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none bg-white"
                      >
                        <option value="planned">Planned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="ready">Ready</option>
                        <option value="completed">Completed</option>
                      </select>
                      <textarea
                        value={elementForm.notes}
                        onChange={(e) => setElementForm({ ...elementForm, notes: e.target.value })}
                        placeholder="Notes / specifications"
                        rows="3"
                        className="md:col-span-2 rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none focus:border-[#c9a9df]"
                      />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        type="button"
                        onClick={saveElement}
                        disabled={elementSaving}
                        className="rounded-xl bg-[#8B6AA8] px-4 py-2 text-sm font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {elementSaving ? 'Saving...' : editingElementId ? 'Update Element' : 'Save Element'}
                      </button>
                      <button
                        type="button"
                        onClick={resetElementForm}
                        className="rounded-xl px-4 py-2 text-sm text-[#8B8194]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {elementsLoading ? (
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-8 text-center text-sm text-[#8B8194]">Loading elements...</div>
                ) : elements.length > 0 ? (
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-[#8B8194]">Your Elements</p>
                        <h4 className="text-lg font-semibold text-[#3F3748] mt-1">Decor Requirements</h4>
                      </div>
                      <p className="text-sm text-[#8B8194]">{elements.length} item{elements.length === 1 ? '' : 's'}</p>
                    </div>
                    <div className="mt-4 space-y-3">
                      {elements.map((element) => (
                        <div key={element.id} className="rounded-xl border border-[#eadff2] bg-white p-4">
                          <div className="flex flex-col md:flex-row md:items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium text-[#3F3748]">{element.name}</p>
                                <span className="rounded-full bg-[#f4eafa] px-2.5 py-1 text-xs text-[#8B6AA8]">{element.category}</span>
                                <span className="rounded-full bg-[#faf7ff] border border-[#eadff2] px-2.5 py-1 text-xs text-[#8B8194] capitalize">{String(element.status || 'planned').replace('_', ' ')}</span>
                              </div>
                              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-[#6B6175]">
                                <p><span className="text-[#8B8194]">Quantity:</span> {element.quantity} {element.unit || 'pcs'}</p>
                                <p><span className="text-[#8B8194]">Size:</span> {element.dimensions || 'Not specified'}</p>
                                <p><span className="text-[#8B8194]">Area:</span> {element.area || 'Not specified'}</p>
                                <p><span className="text-[#8B8194]">Status:</span> {String(element.status || 'planned').replace('_', ' ')}</p>
                              </div>
                              {element.notes && <p className="mt-2 text-sm text-[#6B6175]">{element.notes}</p>}
                            </div>
                            <div className="flex gap-2 md:shrink-0">
                              <button
                                type="button"
                                onClick={() => editElement(element)}
                                className="rounded-lg bg-[#f4eafa] px-3 py-1.5 text-sm text-[#8B6AA8]"
                              >
                                <Edit3 className="inline w-3.5 h-3.5 mr-1" />Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteElement(element.id)}
                                disabled={elementDeletingId === element.id}
                                className="rounded-lg bg-[#fff1f4] px-3 py-1.5 text-sm text-red-400 disabled:opacity-60"
                              >
                                <Trash2 className="inline w-3.5 h-3.5 mr-1" />
                                {elementDeletingId === element.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-8 text-center">
                    <p className="text-sm text-[#8B8194]">No wedding elements added yet.</p>
                    <p className="text-sm text-[#6B6175] mt-1">Add furniture, florals, lighting, props, fabric and other decor requirements for this wedding.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeddingWorkspace;
