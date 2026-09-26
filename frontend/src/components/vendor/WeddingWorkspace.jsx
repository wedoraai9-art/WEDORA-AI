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
  Mail,
  Phone,
  MessageCircle,
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

const emptyQuotation = (wedding) => ({
  title: 'Wedding quotation',
  client_name: wedding?.client_name || [wedding?.bride_name, wedding?.groom_name].filter(Boolean).join(' & '),
  issue_date: new Date().toISOString().slice(0, 10),
  valid_until: '',
  line_items: [{ description: '', quantity: '1', unit: 'service', unit_price: '' }],
  discount_type: 'amount',
  discount_value: '0',
  tax_percent: '0',
  advance_amount: '0',
  terms: '',
  notes: '',
});

const emptyInvoice = (wedding) => ({
  title: 'Wedding invoice',
  client_name: wedding?.client_name || [wedding?.bride_name, wedding?.groom_name].filter(Boolean).join(' & '),
  issue_date: new Date().toISOString().slice(0, 10),
  due_date: '',
  line_items: [{ description: '', quantity: '1', unit: 'service', unit_price: '' }],
  discount_type: 'amount',
  discount_value: '0',
  tax_percent: '0',
  terms: '',
  notes: '',
});

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

const CATEGORY_DECOR_ITEMS = {
  General: [
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
  ],
  Mandap: [
    'Mandap Platform',
    'Mandap Structure',
    'Mandap Pillars',
    'Mandap Backdrop',
    'Mandap Carpet',
    'Mandap Florals',
    'Mandap Draping',
    'Mandap Ceiling',
    'Mandap Seating',
    'Mandap Lighting',
  ],
  Stage: [
    'Stage Platform',
    'Stage Backdrop',
    'LED Wall',
    'Stage Carpet',
    'Stage Riser',
    'Stage Sofa',
    'Stage Chairs',
    'Stage Panels',
    'Stage Florals',
    'Stage Lighting',
  ],
  Entrance: [
    'Entrance Gate',
    'Welcome Board',
    'Floral Arch',
    'Entrance Carpet',
    'Entrance Signage',
    'Entrance Draping',
    'Entrance Florals',
    'Entrance Lighting',
    'Valet Signage',
  ],
  Furniture: [
    'Chair',
    'Sofa',
    'Table',
    'Bar Counter',
    'Cocktail Table',
    'Ottoman',
    'Bench',
    'Podium',
    'High Table',
    'Lounge Set',
  ],
  'Flooring & Carpet': [
    'Carpet',
    'Wooden Flooring',
    'Artificial Grass',
    'Platform',
    'Riser',
    'Aisle Carpet',
    'Dance Floor',
    'Red Carpet',
  ],
  Floral: [
    'Floral Backdrop',
    'Floral Arch',
    'Centerpiece',
    'Table Florals',
    'Ceiling Florals',
    'Hanging Florals',
    'Petal Decor',
    'Garland',
    'Flower Wall',
  ],
  Lighting: [
    'Fairy Lights',
    'Chandelier',
    'Moving Head',
    'Par Can',
    'Profile Light',
    'Uplighter',
    'Pin Spot',
    'String Lights',
    'Festoon Lights',
    'Warm Wash',
  ],
  Truss: [
    'Decor Truss',
    'Sound Truss',
    'Lighting Truss',
    'Ground Support',
    'Truss Gate',
    'Truss Backdrop',
    'Truss Arch',
  ],
  'Sound & AV': [
    'Sound Truss',
    'Line Array',
    'Subwoofer',
    'Stage Monitor',
    'Microphone',
    'DJ Console',
    'LED Screen',
    'Projector',
    'Confidence Monitor',
  ],
  'Fabric & Draping': [
    'Backdrop Fabric',
    'Ceiling Draping',
    'Wall Draping',
    'Pillar Draping',
    'Stage Draping',
    'Mandap Draping',
    'Entrance Draping',
    'Table Skirting',
    'Fabric Panels',
  ],
  'Decor Props': [
    'Decor Props',
    'Vases',
    'Lanterns',
    'Candle Stands',
    'Mirror',
    'Vintage Props',
    'Rajasthani Props',
    'Decorative Panels',
    'Pedestals',
  ],
  'Table Decor': [
    'Table',
    'Table Cloth',
    'Table Runner',
    'Centerpiece',
    'Candle Holder',
    'Table Number',
    'Menu Card',
    'Napkin Ring',
    'Charger Plate',
  ],
  'Printing & Branding': [
    'Flex',
    'Welcome Board',
    'Backdrop Print',
    'Vinyl Print',
    'Foam Board',
    'Sunboard',
    'Table Number',
    'Menu Card',
    'Directional Sign',
  ],
  Electrical: [
    'Power Distribution',
    'Extension Board',
    'Cable',
    'Generator Connection',
    'DB Box',
    'Electrical Panel',
    'Cable Cover',
  ],
  Production: [
    'Platform',
    'Riser',
    'Backdrop',
    'Panel',
    'Podium',
    'Stall',
    'Production Desk',
    'Service Table',
  ],
  Transportation: [
    'Transport Vehicle',
    'Tempo',
    'Truck',
    'Loading',
    'Unloading',
    'Material Pickup',
  ],
  Signage: [
    'Welcome Sign',
    'Directional Sign',
    'Parking Sign',
    'Table Sign',
    'Room Sign',
    'Bride & Groom Sign',
    'Hashtag Sign',
  ],
  Other: [
    'Miscellaneous Decor',
    'Custom Prop',
    'Special Requirement',
  ],
};


const getWeddingCountdown = (weddingDate) => {
  if (!weddingDate) return null;

  const dateText = String(weddingDate).slice(0, 10);
  const [year, month, day] = dateText.split('-').map(Number);

  if (!year || !month || !day) return null;

  const target = new Date(year, month - 1, day);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const diffMs = target.getTime() - todayStart.getTime();
  const days = Math.round(diffMs / 86400000);

  return {
    days,
    isToday: days === 0,
    isPast: days < 0,
  };
};

const WeddingWorkspace = ({ wedding, vendor, onBack }) => {
  const weddingCountdown = getWeddingCountdown(wedding?.wedding_date);

  const vendorPlan = String(vendor?.plan || 'free').trim().toLowerCase();
  const hasPaidAI = vendorPlan === 'pro';
  const vendorBusinessName = String(vendor?.business_name || vendor?.name || 'Your Business').trim();
  const vendorCategory = String(vendor?.category || '').trim().toLowerCase();

  const [activeModule, setActiveModule] = useState(null);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskUpdatingId, setTaskUpdatingId] = useState(null);
  const [clients, setClients] = useState([]);
  const [availableWeddings, setAvailableWeddings] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientWhatsapp, setClientWhatsapp] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientRelation, setClientRelation] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [clientStatus, setClientStatus] = useState("Lead");
  const [clientFollowUpDate, setClientFollowUpDate] = useState("");
  const [clientWeddingIds, setClientWeddingIds] = useState([]);
  const [savingClient, setSavingClient] = useState(false);
  const [editingClientId, setEditingClientId] = useState(null);
  const [communicationDrafts, setCommunicationDrafts] = useState({});
  const [savingCommunicationId, setSavingCommunicationId] = useState(null);
  const [clientHistory, setClientHistory] = useState({});
  const [clientHistoryLoadingId, setClientHistoryLoadingId] = useState(null);
  const [expandedClientHistoryId, setExpandedClientHistoryId] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);

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

  const [quotations, setQuotations] = useState([]);
  const [quotationsLoading, setQuotationsLoading] = useState(false);
  const [quotationSaving, setQuotationSaving] = useState(false);
  const [showQuotationForm, setShowQuotationForm] = useState(false);
  const [editingQuotationId, setEditingQuotationId] = useState(null);
  const [quotationForm, setQuotationForm] = useState(() => emptyQuotation(wedding));
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState(() => emptyInvoice(wedding));
  const [payingInvoiceId, setPayingInvoiceId] = useState(null);
  const [invoicePaymentSaving, setInvoicePaymentSaving] = useState(false);
  const [invoicePaymentForm, setInvoicePaymentForm] = useState({
    amount: '', payment_date: new Date().toISOString().slice(0, 10), payment_method: 'Other', notes: '',
  });

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
    dimension_unit: 'ft',
    area: '',
    function: 'All Functions',
    status: 'planned',
    pricing_type: 'manual',
    sourcing_type: 'unspecified',
    rate: '',
    estimated_cost: '',
    actual_cost: '',
    supplier: '',
    supplier_contact: '',
    notes: '',
  };
  const [elements, setElements] = useState([]);
  const [elementsLoading, setElementsLoading] = useState(false);
  const [elementSummary, setElementSummary] = useState({
    total_elements: 0,
    ordered_elements: 0,
    pending_elements: 0,
    estimated_cost: 0,
    actual_cost: 0,
  });
  const [elementSearch, setElementSearch] = useState('');
  const [elementFilterCategory, setElementFilterCategory] = useState('All Categories');
  const [elementFilterFunction, setElementFilterFunction] = useState('All Functions');
  const [elementFilterStatus, setElementFilterStatus] = useState('All Status');
  const [elementFilterPricing, setElementFilterPricing] = useState('All Pricing');
  const [elementFilterSupplier, setElementFilterSupplier] = useState('All Suppliers');
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


  const getWeddingAiSessionId = () =>
    `vendor-wedding-ai-${vendor?.id || vendor?._id || 'vendor'}`;

  const getWeddingAiContext = () => {
    const weddingDetails = [
      `Wedding name: ${wedding?.wedding_name || "Not set"}`,
      `Bride: ${wedding?.bride_name || "Not set"}`,
      `Groom: ${wedding?.groom_name || "Not set"}`,
      `Wedding date: ${wedding?.wedding_date || "Not set"}`,
      `City: ${wedding?.city || "Not set"}`,
      `Venue: ${wedding?.venue || "Not set"}`,
      `Guest count: ${wedding?.guest_count || "Not set"}`,
      `Wedding budget: ${wedding?.budget || "Not set"}`,
      `Status: ${wedding?.status || "Not set"}`,
    ].join("\n");

    return `You are WEDORA Wedding AI Assistant for a ${vendorCategory} vendor.
Business: ${vendorBusinessName}
Vendor category: ${vendorCategory}

Adapt your answer to this vendor category. Do not assume the vendor is a decorator.
You can help with wedding planning, timelines, tasks, client communication, budgeting, vendor coordination, sourcing, operations, documents, guest planning and category-specific work.
Use the wedding information below as context.
Do not invent facts. If information is missing, say what is missing.

CURRENT WEDDING:
${weddingDetails}`;
  };

  useEffect(() => {
    if (activeModule !== "AI Assistant") return;

    if (!hasPaidAI) {
      setAiMessages([]);
      setAiError("");
      return;
    }

    let cancelled = false;
    const sessionId = getWeddingAiSessionId();

    const loadAiHistory = async () => {
      setAiError("");
      try {
        const res = await authAxios.get(`/vendor/wedding-ai/history/${sessionId}`);
        if (cancelled) return;
        const messages = Array.isArray(res.data?.messages) ? res.data.messages : [];
        setAiMessages(messages.map((message) => ({
          role: message.role,
          content: message.content,
        })));
      } catch (error) {
        if (!cancelled) {
          setAiMessages([]);
          setAiError("Couldn't load the wedding AI conversation.");
        }
      }
    };

    loadAiHistory();

    return () => {
      cancelled = true;
    };
  }, [activeModule, wedding?.id, wedding?._id, hasPaidAI]);

  const sendWeddingAiMessage = async () => {
    if (!hasPaidAI) {
      setAiError("Wedding AI Assistant is available only on WEDORA PRO plans.");
      return;
    }

    const message = aiInput.trim();
    if (!message || aiLoading) return;

    const sessionId = getWeddingAiSessionId();
    const userMessage = { role: "user", content: message };

    setAiMessages((prev) => [...prev, userMessage]);
    setAiInput("");
    setAiLoading(true);
    setAiError("");

    try {
      const prompt = `${getWeddingAiContext()}

USER QUESTION:
${message}`;

      const res = await authAxios.post("/vendor/wedding-ai", {
        session_id: sessionId,
        message: prompt,
      });

      const reply = res.data?.reply || "I couldn't generate a response right now.";
      setAiMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (error) {
      setAiError(
        error?.response?.data?.detail ||
        "WEDORA AI couldn't respond right now. Please try again."
      );
      setAiMessages((prev) => prev.filter((item) => item !== userMessage));
      setAiInput(message);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (wedding?.id) {
      setTasks([]);
      loadTasks();
      loadClients();
      loadAvailableWeddings();
      loadBudget();
      loadQuotations();
      loadInvoices();
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
    setClientsLoading(true);
    try {
      const response = await authAxios.get('/vendor/clients');
      setClients(Array.isArray(response.data?.clients) ? response.data.clients : []);
    } catch (error) {
      console.error("Failed to load clients:", error);
      setClients([]);
    } finally {
      setClientsLoading(false);
    }
  };

  const loadAvailableWeddings = async () => {
    try {
      const response = await authAxios.get('/vendor/weddings');
      const loaded = Array.isArray(response.data?.weddings) ? response.data.weddings : [];
      setAvailableWeddings(loaded);
    } catch (error) {
      console.error('Failed to load wedding list for client CRM:', error);
      setAvailableWeddings(wedding ? [wedding] : []);
    }
  };

  const loadTasks = async () => {
    if (!wedding?.id) return;
    setTasksLoading(true);
    try {
      const response = await authAxios.get(
        `/vendor/weddings/${wedding.id}/tasks`
      );
      setTasks(Array.isArray(response.data?.tasks) ? response.data.tasks : []);
    } catch (error) {
      console.error("Failed to load wedding tasks:", error);
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  const resetTaskForm = () => {
    setTaskTitle("");
    setTaskDueDate("");
    setEditingTaskId(null);
    setShowTaskForm(false);
  };

  const saveTask = async () => {
    const title = taskTitle.trim();
    if (!title || taskSaving || !wedding?.id) return;

    setTaskSaving(true);
    try {
      const payload = { title, due_date: taskDueDate };
      if (editingTaskId) {
        await authAxios.patch(
          `/vendor/weddings/${wedding.id}/tasks/${editingTaskId}`,
          payload
        );
      } else {
        await authAxios.post(
          `/vendor/weddings/${wedding.id}/tasks`,
          { ...payload, completed: false }
        );
      }
      resetTaskForm();
      await loadTasks();
    } catch (error) {
      console.error("Failed to save wedding task:", error);
      window.alert(error.response?.data?.detail || "Could not save task.");
    } finally {
      setTaskSaving(false);
    }
  };

  const toggleTask = async (task) => {
    if (!task?.id || taskUpdatingId) return;
    setTaskUpdatingId(task.id);
    try {
      await authAxios.patch(
        `/vendor/weddings/${wedding.id}/tasks/${task.id}`,
        { completed: !task.completed }
      );
      await loadTasks();
    } catch (error) {
      console.error("Failed to update wedding task:", error);
      window.alert(error.response?.data?.detail || "Could not update task.");
    } finally {
      setTaskUpdatingId(null);
    }
  };

  const deleteTask = async (task) => {
    if (!task?.id || !window.confirm("Delete this task?")) return;
    setTaskUpdatingId(task.id);
    try {
      await authAxios.delete(
        `/vendor/weddings/${wedding.id}/tasks/${task.id}`
      );
      await loadTasks();
    } catch (error) {
      console.error("Failed to delete wedding task:", error);
      window.alert(error.response?.data?.detail || "Could not delete task.");
    } finally {
      setTaskUpdatingId(null);
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

  const loadQuotations = async () => {
    if (!wedding?.id) return;
    setQuotationsLoading(true);
    try {
      const response = await authAxios.get(`/vendor/weddings/${wedding.id}/quotations`);
      setQuotations(Array.isArray(response.data?.quotations) ? response.data.quotations : []);
    } catch (error) {
      console.error('Failed to load wedding quotations:', error);
      setQuotations([]);
    } finally {
      setQuotationsLoading(false);
    }
  };

  const resetQuotationForm = () => {
    setQuotationForm(emptyQuotation(wedding));
    setEditingQuotationId(null);
    setShowQuotationForm(false);
  };

  const updateQuotationLine = (index, field, value) => {
    setQuotationForm((current) => ({
      ...current,
      line_items: current.line_items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const saveQuotation = async () => {
    if (quotationSaving) return;
    const lineItems = quotationForm.line_items
      .filter((item) => String(item.description || '').trim())
      .map((item) => ({
        ...item,
        description: String(item.description || '').trim(),
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
      }));
    if (!lineItems.length || lineItems.some((item) => !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unit_price) || item.unit_price < 0)) {
      window.alert('Add a description, quantity, and valid price for at least one line item.');
      return;
    }
    setQuotationSaving(true);
    try {
      const payload = {
        ...quotationForm,
        title: String(quotationForm.title || '').trim() || 'Quotation',
        client_name: String(quotationForm.client_name || '').trim(),
        line_items: lineItems,
        discount_value: Number(quotationForm.discount_value || 0),
        tax_percent: Number(quotationForm.tax_percent || 0),
        advance_amount: Number(quotationForm.advance_amount || 0),
      };
      if (editingQuotationId) {
        await authAxios.put(`/vendor/weddings/${wedding.id}/quotations/${editingQuotationId}`, payload);
      } else {
        await authAxios.post(`/vendor/weddings/${wedding.id}/quotations`, payload);
      }
      resetQuotationForm();
      await loadQuotations();
    } catch (error) {
      console.error('Failed to save wedding quotation:', error);
      window.alert(error.response?.data?.detail || 'Could not save quotation.');
    } finally {
      setQuotationSaving(false);
    }
  };

  const editQuotation = (quotation) => {
    setEditingQuotationId(quotation.id);
    setQuotationForm({
      ...emptyQuotation(wedding),
      ...quotation,
      line_items: Array.isArray(quotation.line_items) && quotation.line_items.length
        ? quotation.line_items.map((item) => ({
            description: item.description || '',
            quantity: String(item.quantity ?? 1),
            unit: item.unit || 'unit',
            unit_price: String(item.unit_price ?? 0),
          }))
        : [{ description: '', quantity: '1', unit: 'service', unit_price: '' }],
      discount_value: String(quotation.discount_value ?? 0),
      tax_percent: String(quotation.tax_percent ?? 0),
      advance_amount: String(quotation.advance_amount ?? 0),
    });
    setShowQuotationForm(true);
  };

  const deleteQuotation = async (quotationId) => {
    if (!window.confirm('Delete this quotation?')) return;
    try {
      await authAxios.delete(`/vendor/weddings/${wedding.id}/quotations/${quotationId}`);
      await loadQuotations();
    } catch (error) {
      console.error('Failed to delete wedding quotation:', error);
      window.alert(error.response?.data?.detail || 'Could not delete quotation.');
    }
  };

  const loadInvoices = async () => {
    if (!wedding?.id) return;
    setInvoicesLoading(true);
    try {
      const response = await authAxios.get(`/vendor/weddings/${wedding.id}/invoices`);
      setInvoices(Array.isArray(response.data?.invoices) ? response.data.invoices : []);
    } catch (error) {
      console.error('Failed to load wedding invoices:', error);
      setInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const resetInvoiceForm = () => {
    setInvoiceForm(emptyInvoice(wedding));
    setEditingInvoiceId(null);
    setShowInvoiceForm(false);
  };

  const updateInvoiceLine = (index, field, value) => {
    setInvoiceForm((current) => ({
      ...current,
      line_items: current.line_items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const saveInvoice = async () => {
    if (invoiceSaving) return;
    const lineItems = invoiceForm.line_items
      .filter((item) => String(item.description || '').trim())
      .map((item) => ({
        ...item,
        description: String(item.description || '').trim(),
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
      }));
    if (!lineItems.length || lineItems.some((item) => !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unit_price) || item.unit_price < 0)) {
      window.alert('Add a description, quantity, and valid price for at least one line item.');
      return;
    }
    setInvoiceSaving(true);
    try {
      const payload = {
        ...invoiceForm,
        title: String(invoiceForm.title || '').trim() || 'Invoice',
        client_name: String(invoiceForm.client_name || '').trim(),
        line_items: lineItems,
        discount_value: Number(invoiceForm.discount_value || 0),
        tax_percent: Number(invoiceForm.tax_percent || 0),
      };
      if (editingInvoiceId) {
        await authAxios.put(`/vendor/weddings/${wedding.id}/invoices/${editingInvoiceId}`, payload);
      } else {
        await authAxios.post(`/vendor/weddings/${wedding.id}/invoices`, payload);
      }
      resetInvoiceForm();
      await loadInvoices();
    } catch (error) {
      console.error('Failed to save wedding invoice:', error);
      window.alert(error.response?.data?.detail || 'Could not save invoice.');
    } finally {
      setInvoiceSaving(false);
    }
  };

  const editInvoice = (invoice) => {
    setEditingInvoiceId(invoice.id);
    setInvoiceForm({
      ...emptyInvoice(wedding),
      ...invoice,
      line_items: Array.isArray(invoice.line_items) && invoice.line_items.length
        ? invoice.line_items.map((item) => ({
            description: item.description || '', quantity: String(item.quantity ?? 1),
            unit: item.unit || 'unit', unit_price: String(item.unit_price ?? 0),
          }))
        : [{ description: '', quantity: '1', unit: 'service', unit_price: '' }],
      discount_value: String(invoice.discount_value ?? 0),
      tax_percent: String(invoice.tax_percent ?? 0),
    });
    setShowInvoiceForm(true);
  };

  const deleteInvoice = async (invoiceId) => {
    if (!window.confirm('Delete this invoice and its recorded receipts?')) return;
    try {
      await authAxios.delete(`/vendor/weddings/${wedding.id}/invoices/${invoiceId}`);
      await loadInvoices();
    } catch (error) {
      console.error('Failed to delete wedding invoice:', error);
      window.alert(error.response?.data?.detail || 'Could not delete invoice.');
    }
  };

  const startInvoicePayment = (invoice) => {
    setPayingInvoiceId(invoice.id);
    setInvoicePaymentForm({
      amount: String(invoice.balance_amount || ''),
      payment_date: new Date().toISOString().slice(0, 10),
      payment_method: 'Other',
      notes: '',
    });
  };

  const recordInvoicePayment = async (invoice) => {
    if (invoicePaymentSaving) return;
    const amount = Number(invoicePaymentForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert('Enter a payment amount greater than zero.');
      return;
    }
    setInvoicePaymentSaving(true);
    try {
      await authAxios.post(`/vendor/weddings/${wedding.id}/invoices/${invoice.id}/payments`, {
        ...invoicePaymentForm,
        amount,
      });
      setPayingInvoiceId(null);
      await loadInvoices();
    } catch (error) {
      console.error('Failed to record invoice payment:', error);
      window.alert(error.response?.data?.detail || 'Could not record payment.');
    } finally {
      setInvoicePaymentSaving(false);
    }
  };

  const printInvoice = (invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.alert('Please allow pop-ups for WEDORA to print or save this invoice as a PDF.');
      return;
    }
    const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
    const rows = (invoice.line_items || []).map((item) => `<tr><td>${safe(item.description)}</td><td>${safe(item.quantity)} ${safe(item.unit || '')}</td><td>₹${Number(item.unit_price || 0).toLocaleString('en-IN')}</td><td>₹${Number(item.amount || 0).toLocaleString('en-IN')}</td></tr>`).join('');
    const status = String(invoice.status || 'unpaid').toUpperCase();
    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${safe(invoice.invoice_number)} invoice</title><style>body{font:14px Arial,sans-serif;color:#30283a;margin:40px}h1{font-size:26px;margin:0 0 6px}p{line-height:1.5}.muted{color:#756d7d}table{width:100%;border-collapse:collapse;margin:24px 0}th,td{text-align:left;padding:12px 8px;border-bottom:1px solid #e7dfea}th{background:#faf7ff}.totals{margin-left:auto;width:280px}.totals div{display:flex;justify-content:space-between;padding:5px}.grand{font-weight:bold;font-size:17px;border-top:1px solid #bba8c8;margin-top:6px;padding-top:10px!important}@media print{body{margin:18mm}}</style></head><body><h1>${safe(vendorBusinessName)}</h1><p class="muted">INVOICE · ${safe(status)}</p><h2>${safe(invoice.title || 'Invoice')}</h2><p><strong>Invoice:</strong> ${safe(invoice.invoice_number)}<br><strong>Client:</strong> ${safe(invoice.client_name || '—')}<br><strong>Wedding:</strong> ${safe(wedding.wedding_name || wedding.name || 'Wedding')}<br><strong>Issued:</strong> ${safe(invoice.issue_date || '—')} &nbsp; <strong>Due:</strong> ${safe(invoice.due_date || '—')}</p><table><thead><tr><th>Item</th><th>Quantity</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><div class="totals"><div><span>Subtotal</span><span>₹${Number(invoice.subtotal || 0).toLocaleString('en-IN')}</span></div><div><span>Discount</span><span>− ₹${Number(invoice.discount_amount || 0).toLocaleString('en-IN')}</span></div><div><span>Tax (${Number(invoice.tax_percent || 0)}%)</span><span>₹${Number(invoice.tax_amount || 0).toLocaleString('en-IN')}</span></div><div class="grand"><span>Total</span><span>₹${Number(invoice.total || 0).toLocaleString('en-IN')}</span></div><div><span>Paid</span><span>₹${Number(invoice.paid_amount || 0).toLocaleString('en-IN')}</span></div><div><strong>Balance</strong><strong>₹${Number(invoice.balance_amount || 0).toLocaleString('en-IN')}</strong></div></div>${invoice.terms ? `<h3>Terms</h3><p>${safe(invoice.terms).replace(/\n/g, '<br>')}</p>` : ''}${invoice.notes ? `<h3>Notes</h3><p>${safe(invoice.notes).replace(/\n/g, '<br>')}</p>` : ''}<script>window.onload=()=>setTimeout(()=>window.print(),250);</script></body></html>`);
    printWindow.document.close();
  };

  const printReceipt = (invoice, receipt) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.alert('Please allow pop-ups for WEDORA to print or save this receipt as a PDF.');
      return;
    }
    const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${safe(receipt.receipt_number)} receipt</title><style>body{font:14px Arial,sans-serif;color:#30283a;margin:40px}.receipt{max-width:700px;margin:0 auto;border:1px solid #e7dfea;padding:32px;border-radius:16px}h1{font-size:24px}.amount{font-size:28px;font-weight:bold;color:#6b4f82;margin:24px 0}.muted{color:#756d7d;line-height:1.7}@media print{body{margin:18mm}.receipt{border:1px solid #bbb}}</style></head><body><div class="receipt"><p class="muted">PAYMENT RECEIPT</p><h1>${safe(vendorBusinessName)}</h1><p>Receipt number: <strong>${safe(receipt.receipt_number)}</strong><br>Invoice: ${safe(invoice.invoice_number)} · ${safe(invoice.title || 'Invoice')}<br>Received from: ${safe(invoice.client_name || 'Client')}<br>Wedding: ${safe(wedding.wedding_name || wedding.name || 'Wedding')}</p><div class="amount">₹${Number(receipt.amount || 0).toLocaleString('en-IN')}</div><p class="muted">Received on ${safe(receipt.payment_date || '—')} by ${safe(receipt.payment_method || 'Other')}${receipt.notes ? `<br>${safe(receipt.notes)}` : ''}</p><p class="muted">Invoice balance after this payment: ₹${Number(invoice.balance_amount || 0).toLocaleString('en-IN')}</p></div><script>window.onload=()=>setTimeout(()=>window.print(),250);</script></body></html>`);
    printWindow.document.close();
  };

  const printQuotation = (quotation) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.alert('Please allow pop-ups for WEDORA to print or save this quotation as a PDF.');
      return;
    }
    const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
    const rows = (quotation.line_items || []).map((item) => `
      <tr><td>${safe(item.description)}</td><td>${safe(item.quantity)} ${safe(item.unit || '')}</td>
      <td>₹${Number(item.unit_price || 0).toLocaleString('en-IN')}</td>
      <td>₹${Number(item.amount || 0).toLocaleString('en-IN')}</td></tr>`).join('');
    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${safe(quotation.title || 'Quotation')}</title>
      <style>body{font:14px Arial,sans-serif;color:#30283a;margin:40px}h1{font-size:26px;margin:0 0 6px}p{line-height:1.5}.muted{color:#756d7d}table{width:100%;border-collapse:collapse;margin:24px 0}th,td{text-align:left;padding:12px 8px;border-bottom:1px solid #e7dfea}th{background:#faf7ff}.totals{margin-left:auto;width:280px}.totals div{display:flex;justify-content:space-between;padding:5px}.grand{font-weight:bold;font-size:17px;border-top:1px solid #bba8c8;margin-top:6px;padding-top:10px!important}@media print{body{margin:18mm}}</style>
      </head><body><h1>${safe(vendorBusinessName)}</h1><p class="muted">QUOTATION</p><h2>${safe(quotation.title || 'Wedding quotation')}</h2>
      <p><strong>Client:</strong> ${safe(quotation.client_name || '—')}<br><strong>Wedding:</strong> ${safe(wedding.wedding_name || wedding.name || 'Wedding')}<br>
      <strong>Issued:</strong> ${safe(quotation.issue_date || '—')} &nbsp; <strong>Valid until:</strong> ${safe(quotation.valid_until || '—')}</p>
      <table><thead><tr><th>Item</th><th>Quantity</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="totals"><div><span>Subtotal</span><span>₹${Number(quotation.subtotal || 0).toLocaleString('en-IN')}</span></div>
      <div><span>Discount</span><span>− ₹${Number(quotation.discount_amount || 0).toLocaleString('en-IN')}</span></div>
      <div><span>Tax (${Number(quotation.tax_percent || 0)}%)</span><span>₹${Number(quotation.tax_amount || 0).toLocaleString('en-IN')}</span></div>
      <div class="grand"><span>Total</span><span>₹${Number(quotation.total || 0).toLocaleString('en-IN')}</span></div>
      <div><span>Advance</span><span>₹${Number(quotation.advance_amount || 0).toLocaleString('en-IN')}</span></div>
      <div><strong>Balance</strong><strong>₹${Number(quotation.balance_amount || 0).toLocaleString('en-IN')}</strong></div></div>
      ${quotation.terms ? `<h3>Terms</h3><p>${safe(quotation.terms).replace(/\n/g, '<br>')}</p>` : ''}
      ${quotation.notes ? `<h3>Notes</h3><p>${safe(quotation.notes).replace(/\n/g, '<br>')}</p>` : ''}
      <script>window.onload=()=>setTimeout(()=>window.print(),250);</script></body></html>`);
    printWindow.document.close();
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

  const selectCategoryElement = (name) => {
    if (!name) return;
    setElementForm((current) => ({ ...current, name }));
  };

  const loadElements = async () => {
    if (!wedding?.id || !isDecorator) return;
    setElementsLoading(true);
    try {
      const [elementsResponse, summaryResponse] = await Promise.all([
        authAxios.get(`/vendor/weddings/${wedding.id}/elements`),
        authAxios.get(`/vendor/weddings/${wedding.id}/elements-summary`),
      ]);
      setElements(elementsResponse.data?.elements || []);
      setElementSummary(summaryResponse.data?.summary || {
        total_elements: 0,
        ordered_elements: 0,
        pending_elements: 0,
        estimated_cost: 0,
        actual_cost: 0,
      });
    } catch (error) {
      console.error("Failed to load wedding elements:", error);
    } finally {
      setElementsLoading(false);
    }
  };

  const parseElementAreaSqft = (dimensions, dimensionUnit = 'ft') => {
    const values = String(dimensions || '').match(/\d+(?:\.\d+)?/g) || [];
    if (values.length < 2) return 0;
    let area = Number(values[0]) * Number(values[1]);
    if (String(dimensionUnit).toLowerCase() === 'm') {
      area *= 10.7639104167;
    }
    return Number(area.toFixed(2));
  };

  const getElementEstimatedCost = (form) => {
    const quantity = Number(form.quantity || 0);
    const rate = Number(form.rate || 0);

    if (form.pricing_type === 'per_sqft') {
      return Number((parseElementAreaSqft(form.dimensions, form.dimension_unit) * rate * quantity).toFixed(2));
    }

    if (form.pricing_type === 'per_unit') {
      return Number((quantity * rate).toFixed(2));
    }

    return Number(form.estimated_cost || 0);
  };

  const formatElementCurrency = (amount) => {
    const value = Number(amount || 0);
    return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  // Positive variance = actual cost is below the estimate (saving).
  // Negative variance = actual cost is above the estimate (overrun).
  const getElementCostVariance = (estimated, actual) => {
    return Number((Number(estimated || 0) - Number(actual || 0)).toFixed(2));
  };

  const formatElementVariance = (estimated, actual) => {
    const variance = getElementCostVariance(estimated, actual);
    if (Number(actual || 0) <= 0) return 'Actual cost not entered';
    if (variance > 0) return `${formatElementCurrency(variance)} saving`;
    if (variance < 0) return `${formatElementCurrency(Math.abs(variance))} overrun`;
    return 'On estimate';
  };

  const elementCostVariance = getElementCostVariance(
    elementSummary.estimated_cost,
    elementSummary.actual_cost
  );

  const elementSupplierOptions = Array.from(
    new Set(
      elements
        .map((element) => String(element.supplier || '').trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  const filteredElements = elements.filter((element) => {
    const query = elementSearch.trim().toLowerCase();
    const matchesSearch = !query || [
      element.name,
      element.category,
      element.function,
      element.area,
      element.supplier,
      element.notes,
    ].some((value) => String(value || '').toLowerCase().includes(query));

    const matchesCategory =
      elementFilterCategory === 'All Categories' ||
      String(element.category || 'General') === elementFilterCategory;

    const matchesFunction =
      elementFilterFunction === 'All Functions' ||
      String(element.function || 'All Functions') === elementFilterFunction;

    const matchesStatus =
      elementFilterStatus === 'All Status' ||
      String(element.status || 'planned') === elementFilterStatus;

    const matchesPricing =
      elementFilterPricing === 'All Pricing' ||
      (elementFilterPricing === 'Per Sq Ft' && String(element.pricing_type || 'manual') === 'per_sqft') ||
      (elementFilterPricing === 'Per Unit' && String(element.pricing_type || 'manual') === 'per_unit') ||
      (elementFilterPricing === 'Manual' && String(element.pricing_type || 'manual') === 'manual');

    const matchesSupplier =
      elementFilterSupplier === 'All Suppliers' ||
      String(element.supplier || '').trim() === elementFilterSupplier;

    return matchesSearch && matchesCategory && matchesFunction && matchesStatus && matchesPricing && matchesSupplier;
  });

  const clearElementFilters = () => {
    setElementSearch('');
    setElementFilterCategory('All Categories');
    setElementFilterFunction('All Functions');
    setElementFilterStatus('All Status');
    setElementFilterPricing('All Pricing');
    setElementFilterSupplier('All Suppliers');
  };

  const hasActiveElementFilters =
    Boolean(elementSearch.trim()) ||
    elementFilterCategory !== 'All Categories' ||
    elementFilterFunction !== 'All Functions' ||
    elementFilterStatus !== 'All Status' ||
    elementFilterPricing !== 'All Pricing' ||
    elementFilterSupplier !== 'All Suppliers';

  const supplierContactMap = elements.reduce((map, element) => {
    const supplier = String(element.supplier || '').trim();
    const contact = String(element.supplier_contact || '').trim();
    if (supplier && contact && !map.has(supplier)) {
      map.set(supplier, contact);
    }
    return map;
  }, new Map());

  const supplierOverview = Array.from(
    elements.reduce((map, element) => {
      const supplier = String(element.supplier || '').trim();
      if (!supplier) return map;

      const current = map.get(supplier) || {
        supplier,
        contact: String(element.supplier_contact || '').trim(),
        elements: 0,
        ordered: 0,
        pending: 0,
        estimated: 0,
        actual: 0,
      };

      if (!current.contact && String(element.supplier_contact || '').trim()) {
        current.contact = String(element.supplier_contact || '').trim();
      }

      const status = String(element.status || 'planned');
      const isOrdered = ['ordered', 'received', 'installed', 'completed'].includes(status);

      current.elements += 1;
      current.ordered += isOrdered ? 1 : 0;
      current.pending += isOrdered ? 0 : 1;
      current.estimated += Number(element.estimated_cost || 0);
      current.actual += Number(element.actual_cost || 0);

      map.set(supplier, current);
      return map;
    }, new Map()).values()
  ).sort((a, b) => b.estimated - a.estimated);

  // Procurement Summary:
  // Group identical elements so repeated requirements become one procurement line.
  // Quantity, area, estimated cost and actual cost are summed automatically.
  const procurementSummary = Array.from(
    elements.reduce((map, element) => {
      const name = String(element.name || 'Unnamed Element').trim();
      const category = String(element.category || 'General').trim();
      const unit = String(element.unit || 'pcs').trim();
      const functionName = String(element.function || 'All Functions').trim();
      const supplier = String(element.supplier || '').trim();
      const sourcingType = String(element.sourcing_type || 'unspecified').trim();

      const key = [
        name.toLowerCase(),
        category.toLowerCase(),
        unit.toLowerCase(),
        functionName.toLowerCase(),
        supplier.toLowerCase(),
        sourcingType.toLowerCase(),
      ].join('|||');

      const current = map.get(key) || {
        name,
        category,
        unit,
        function: functionName,
        supplier,
        sourcing_type: sourcingType,
        quantity: 0,
        area_sqft: 0,
        estimated: 0,
        actual: 0,
        ordered: 0,
        pending: 0,
      };

      const status = String(element.status || 'planned');
      const isOrdered = ['ordered', 'received', 'installed', 'completed'].includes(status);

      current.quantity += Number(element.quantity || 0);
      current.area_sqft += Number(
        element.area_sqft || parseElementAreaSqft(element.dimensions, element.dimension_unit)
      );
      current.estimated += Number(element.estimated_cost || 0);
      current.actual += Number(element.actual_cost || 0);
      current.ordered += isOrdered ? 1 : 0;
      current.pending += isOrdered ? 0 : 1;

      map.set(key, current);
      return map;
    }, new Map()).values()
  ).map((item) => ({
    ...item,
    quantity: Number(item.quantity.toFixed(2)),
    area_sqft: Number(item.area_sqft.toFixed(2)),
    estimated: Number(item.estimated.toFixed(2)),
    actual: Number(item.actual.toFixed(2)),
  })).sort((a, b) => b.estimated - a.estimated);

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
        dimension_unit: elementForm.dimension_unit || 'ft',
        area: elementForm.area.trim(),
        function: elementForm.function || 'All Functions',
        status: elementForm.status || 'planned',
        pricing_type: elementForm.pricing_type || 'manual',
        sourcing_type: elementForm.sourcing_type || 'unspecified',
        rate: Number(elementForm.rate || 0),
        estimated_cost: getElementEstimatedCost(elementForm),
        actual_cost: Number(elementForm.actual_cost || 0),
        supplier: elementForm.supplier.trim(),
        supplier_contact: elementForm.supplier_contact.trim(),
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
      dimension_unit: element.dimension_unit || 'ft',
      area: element.area ? String(element.area) : '',
      function: element.function || 'All Functions',
      status: element.status || 'planned',
      pricing_type: element.pricing_type || 'manual',
      sourcing_type: element.sourcing_type || 'unspecified',
      rate: element.rate != null ? String(element.rate) : '',
      estimated_cost: element.estimated_cost != null ? String(element.estimated_cost) : '',
      actual_cost: element.actual_cost != null ? String(element.actual_cost) : '',
      supplier: element.supplier || '',
      supplier_contact: element.supplier_contact || '',
      notes: element.notes || '',
    });
    setShowElementForm(true);
    setTimeout(() => {
      const form = document.getElementById('wedding-element-form');
      if (!form) return;

      // Position the edit form so its heading is clearly visible below the
      // sticky site header, matching the intended Element Details view.
      const topOffset = 110;
      const targetTop = form.getBoundingClientRect().top + window.scrollY - topOffset;
      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth',
      });
    }, 120);
  };

  const exportElementsCsv = () => {
    const rows = filteredElements.map((element) => ({
      Element: element.name || '',
      Category: element.category || '',
      Quantity: element.quantity ?? '',
      Unit: element.unit || '',
      Dimensions: element.dimensions || '',
      DimensionUnit: element.dimension_unit || '',
      AreaSqFt: element.area_sqft ?? '',
      Function: element.function || '',
      Status: element.status || '',
      SourcingType: element.sourcing_type || 'unspecified',
      PricingType: element.pricing_type || '',
      Rate: element.rate ?? '',
      EstimatedCost: element.estimated_cost ?? '',
      ActualCost: element.actual_cost ?? '',
      Variance: Number(element.actual_cost || 0) - Number(element.estimated_cost || 0),
      Supplier: element.supplier || '',
      SupplierContact: element.supplier_contact || '',
      AreaLocation: element.area || '',
      Notes: element.notes || '',
    }));

    if (!rows.length) {
      window.alert('There are no matching elements to export.');
      return;
    }

    const headers = Object.keys(rows[0]);
    const escapeCsv = (value) => {
      const stringValue = String(value ?? '');
      return `"${stringValue.replace(/"/g, '""')}"`;
    };

    const csv = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(',')),
    ].join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${String(wedding?.wedding_name || wedding?.name || 'wedding').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'wedding'}-elements.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const exportProcurementCsv = () => {
    if (!procurementSummary.length) {
      window.alert('There is no procurement data to export.');
      return;
    }

    const rows = procurementSummary.map((item) => ({
      Item: item.name || '',
      Category: item.category || '',
      Quantity: item.quantity ?? '',
      Unit: item.unit || '',
      AreaSqFt: item.area_sqft ?? '',
      Function: item.function || '',
      Supplier: item.supplier || '',
      Status: item.pending > 0 ? 'Pending' : 'Ordered',
      EstimatedCost: item.estimated ?? '',
      ActualCost: item.actual ?? '',
      Variance: Number(item.actual || 0) - Number(item.estimated || 0),
    }));

    const headers = Object.keys(rows[0]);
    const escapeCsv = (value) => {
      const stringValue = String(value ?? '');
      return `"${stringValue.replace(/"/g, '""')}"`;
    };

    const csv = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(',')),
    ].join('\\r\\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${String(wedding?.wedding_name || wedding?.name || 'wedding').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'wedding'}-procurement-summary.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const deleteElement = async (id) => {
    if (!window.confirm('Delete this wedding element?')) return;
    setElementDeletingId(id);
    try {
      await authAxios.delete(`/vendor/weddings/${wedding.id}/elements/${id}`);
      await loadElements();
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
        '/vendor/clients',
        {
          name: clientName.trim(),
          phone: clientPhone,
          whatsapp: clientWhatsapp,
          email: clientEmail,
          relation: clientRelation,
          notes: clientNotes,
          status: clientStatus,
          follow_up_date: clientFollowUpDate,
          wedding_ids: clientWeddingIds.includes(wedding.id)
            ? clientWeddingIds
            : [...clientWeddingIds, wedding.id],
        }
      );

      resetClientForm();
      await loadClients();
    } catch (error) {
      console.error("Failed to save client:", error);
      window.alert(error.response?.data?.detail || "Could not save client.");
    } finally {
      setSavingClient(false);
    }
  };

  const updateClient = async () => {
    if (!editingClientId || !clientName.trim() || savingClient) return;

    setSavingClient(true);

    try {
      await authAxios.put(
        `/vendor/clients/${editingClientId}`,
        {
          name: clientName.trim(),
          phone: clientPhone,
          whatsapp: clientWhatsapp,
          email: clientEmail,
          relation: clientRelation,
          notes: clientNotes,
          status: clientStatus,
          follow_up_date: clientFollowUpDate,
          wedding_ids: clientWeddingIds.includes(wedding.id)
            ? clientWeddingIds
            : [...clientWeddingIds, wedding.id],
        }
      );

      resetClientForm();
      await loadClients();
    } catch (error) {
      console.error("Failed to update client:", error);
      window.alert(error.response?.data?.detail || "Could not update client.");
    } finally {
      setSavingClient(false);
    }
  };

  const updateClientStatus = async (clientId, status) => {
    try {
      await authAxios.put(`/vendor/clients/${clientId}`, { status });
      await loadClients();
    } catch (error) {
      console.error('Failed to update client status:', error);
      window.alert(error.response?.data?.detail || 'Could not update client status.');
    }
  };

  const resetClientForm = () => {
    setClientName("");
    setClientPhone("");
    setClientWhatsapp("");
    setClientEmail("");
    setClientRelation("");
    setClientNotes("");
    setClientStatus("Lead");
    setClientFollowUpDate("");
    setClientWeddingIds(wedding?.id ? [wedding.id] : []);
    setEditingClientId(null);
    setShowClientForm(false);
  };

  const loadClientHistory = async (clientId) => {
    setClientHistoryLoadingId(clientId);
    try {
      const response = await authAxios.get(`/vendor/clients/${clientId}/history`);
      setClientHistory((current) => ({
        ...current,
        [clientId]: {
          documents: Array.isArray(response.data?.documents) ? response.data.documents : [],
          payments: Array.isArray(response.data?.payments) ? response.data.payments : [],
        },
      }));
    } catch (error) {
      console.error('Failed to load client documents and payment history:', error);
      window.alert(error.response?.data?.detail || 'Could not load client history.');
    } finally {
      setClientHistoryLoadingId(null);
    }
  };

  const toggleClientHistory = async (clientId) => {
    if (expandedClientHistoryId === clientId) {
      setExpandedClientHistoryId(null);
      return;
    }
    setExpandedClientHistoryId(clientId);
    if (!clientHistory[clientId]) await loadClientHistory(clientId);
  };

  const updateCommunicationDraft = (clientId, field, value) => {
    setCommunicationDrafts((current) => ({
      ...current,
      [clientId]: { channel: 'Note', message: '', ...(current[clientId] || {}), [field]: value },
    }));
  };

  const saveClientCommunication = async (clientId) => {
    const draft = communicationDrafts[clientId] || {};
    if (!String(draft.message || '').trim() || savingCommunicationId) return;
    setSavingCommunicationId(clientId);
    try {
      const response = await authAxios.post(
        `/vendor/clients/${clientId}/communications`,
        { channel: draft.channel || 'Note', message: draft.message.trim() }
      );
      setClients((current) => current.map((client) =>
        client.id === clientId
          ? { ...client, communications: [response.data, ...(client.communications || [])] }
          : client
      ));
      setCommunicationDrafts((current) => ({ ...current, [clientId]: { channel: 'Note', message: '' } }));
    } catch (error) {
      console.error('Failed to save client communication:', error);
      window.alert(error.response?.data?.detail || 'Could not save communication note.');
    } finally {
      setSavingCommunicationId(null);
    }
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
    { title: 'Quotations', description: 'Prepare itemized client quotations and save them as PDF', icon: FileText },
    { title: 'Invoices & Receipts', description: 'Track client invoices, payments and printable receipts', icon: FileText },
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
  const quotationSubtotal = (quotationForm.line_items || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0
  );
  const quotationDiscount = quotationForm.discount_type === 'percent'
    ? quotationSubtotal * (Number(quotationForm.discount_value) || 0) / 100
    : Number(quotationForm.discount_value) || 0;
  const quotationTaxable = Math.max(0, quotationSubtotal - Math.min(quotationDiscount, quotationSubtotal));
  const quotationTax = quotationTaxable * (Number(quotationForm.tax_percent) || 0) / 100;
  const quotationTotal = quotationTaxable + quotationTax;
  const quotationBalance = Math.max(0, quotationTotal - (Number(quotationForm.advance_amount) || 0));
  const invoiceDraftSubtotal = (invoiceForm.line_items || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0
  );
  const invoiceDraftDiscount = invoiceForm.discount_type === 'percent'
    ? invoiceDraftSubtotal * (Number(invoiceForm.discount_value) || 0) / 100
    : Number(invoiceForm.discount_value) || 0;
  const invoiceDraftTaxable = Math.max(0, invoiceDraftSubtotal - Math.min(invoiceDraftDiscount, invoiceDraftSubtotal));
  const invoiceDraftTax = invoiceDraftTaxable * (Number(invoiceForm.tax_percent) || 0) / 100;
  const invoiceDraftTotal = invoiceDraftTaxable + invoiceDraftTax;

  return (
    <div className="min-h-screen bg-[#fcf9ff] px-4 pt-28 pb-6 md:px-8 md:pt-32 text-[#2D2638]">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={onBack}
          type="button"
          className="relative z-30 flex items-center gap-2 text-[#8B8194] hover:text-[#2D2638] transition mb-6"
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
                : activeModule === "Quotations"
                ? "Create, save, update and print client quotations for this wedding."
                : activeModule === "Invoices & Receipts"
                ? "Issue invoices, record payments and print invoices or receipts as PDFs."
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
                      onClick={() => {
                        resetTaskForm();
                        setShowTaskForm(true);
                      }}
                      className="rounded-xl bg-[#f4eafa] px-4 py-2 text-sm font-medium text-[#8B6AA8] hover:bg-[#eadcf5]"
                    >
                      + Add Task
                    </button>
                  </div>
                </div>

                {showTaskForm && (
                  <div className="mb-5 rounded-xl border border-[#eadff2] bg-white p-5">
                    <p className="text-sm font-medium text-[#3F3748] mb-2">
                      {editingTaskId ? "Edit Task" : "New Task"}
                    </p>
                    <input
                      type="text"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="Enter task name"
                      className="w-full rounded-xl border border-[#eadff2] bg-[#faf7ff] px-4 py-3 text-sm text-[#3F3748] outline-none focus:border-[#c9a9df]"
                    />
                    <label className="block mt-3 text-xs text-[#8B8194]">
                      Due date
                      <input
                        type="date"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="input mt-1"
                      />
                    </label>
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={saveTask}
                        disabled={taskSaving || !taskTitle.trim()}
                        className="rounded-xl bg-[#f4eafa] px-4 py-2 text-sm font-medium text-[#8B6AA8] disabled:opacity-60"
                      >
                        {taskSaving
                          ? "Saving..."
                          : editingTaskId
                          ? "Update Task"
                          : "Save Task"}
                      </button>
                      <button
                        type="button"
                        onClick={resetTaskForm}
                        className="rounded-xl px-4 py-2 text-sm text-[#8B8194]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {tasksLoading ? (
                  <div className="mb-5 rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5 text-sm text-[#8B8194]">
                    Loading tasks...
                  </div>
                ) : tasks.length > 0 ? (
                  <div className="mb-5 rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                    <p className="text-sm text-[#8B8194]">Your Tasks</p>
                    <div className="mt-3 space-y-2">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 rounded-lg border border-[#eadff2] bg-white px-4 py-3"
                        >
                          <button
                            type="button"
                            onClick={() => toggleTask(task)}
                            disabled={taskUpdatingId === task.id}
                            aria-label={task.completed ? "Mark task incomplete" : "Mark task complete"}
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
                          {task.due_date && (
                            <span className="text-xs text-[#8B8194]">
                              Due {formatDate(task.due_date)}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTaskId(task.id);
                              setTaskTitle(task.title);
                              setTaskDueDate(task.due_date || "");
                              setShowTaskForm(true);
                            }}
                            disabled={taskUpdatingId === task.id}
                            className="ml-auto rounded-lg bg-[#f4eafa] px-3 py-1 text-sm text-[#8B6AA8] disabled:opacity-60"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTask(task)}
                            disabled={taskUpdatingId === task.id}
                            aria-label={`Delete task: ${task.title}`}
                            className="rounded-lg bg-[#fff1f4] px-3 py-1 text-sm text-red-400 disabled:opacity-60"
                          >
                            <Trash2 className="inline w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mb-5 rounded-xl border border-dashed border-[#eadff2] bg-[#faf7ff] p-6 text-center text-sm text-[#8B8194]">
                    No tasks yet. Add a task and due date to track it here.
                  </div>
                )}
              </>
            )}

            {/* CLIENT CRM MODULE */}
            {activeModule === "Clients" && (
              <div className="mt-4 mb-5 rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-sm text-[#8B8194]">Client CRM</p>
                    <h4 className="text-lg font-semibold text-[#3F3748] mt-1">Client Book</h4>
                    <p className="text-sm text-[#6B6175] mt-1">
                      Keep each client’s contact details, follow-ups, conversation notes and linked weddings together.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { resetClientForm(); setShowClientForm(true); }}
                    className="shrink-0 rounded-xl bg-[#f4eafa] px-4 py-2 text-sm font-medium text-[#8B6AA8] hover:bg-[#eadff5]"
                  >
                    <Plus className="inline w-4 h-4 mr-1" /> Add Client
                  </button>
                </div>

                {showClientForm && (
                  <div className="mt-5 rounded-xl border border-[#eadff2] bg-white p-4">
                    <h5 className="font-medium text-[#3F3748] mb-3">{editingClientId ? 'Edit client profile' : 'New client profile'}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client name *" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                      <input value={clientRelation} onChange={(e) => setClientRelation(e.target.value)} placeholder="Relation (Bride / Groom / Family)" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                      <input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="Phone number" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                      <input type="tel" value={clientWhatsapp} onChange={(e) => setClientWhatsapp(e.target.value)} placeholder="WhatsApp number (with country code)" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                      <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="Email address" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                      <select value={clientStatus} onChange={(e) => setClientStatus(e.target.value)} className="rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none">
                        {['Lead', 'Discussion', 'Confirmed', 'Completed'].map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                      <label className="text-xs text-[#8B8194]">Follow-up date<input type="date" value={clientFollowUpDate} onChange={(e) => setClientFollowUpDate(e.target.value)} className="mt-1 block w-full rounded-lg border border-[#eadff2] px-3 py-2 text-sm text-[#3F3748] outline-none" /></label>
                      <div className="md:col-span-2">
                        <p className="text-xs text-[#8B8194] mb-2">Link this client to weddings or events</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border border-[#eadff2] bg-[#fdfbff] p-3 max-h-40 overflow-y-auto">
                          {(availableWeddings.length ? availableWeddings : [wedding]).map((event) => {
                            const eventId = String(event.id || event._id || '');
                            if (!eventId) return null;
                            return (
                              <label key={eventId} className="flex items-start gap-2 text-sm text-[#5b5266]">
                                <input
                                  type="checkbox"
                                  checked={clientWeddingIds.includes(eventId)}
                                  onChange={(e) => setClientWeddingIds((current) => e.target.checked
                                    ? [...new Set([...current, eventId])]
                                    : current.filter((id) => id !== eventId))}
                                  className="mt-1 accent-[#8B6AA8]"
                                />
                                <span>{event.wedding_name || event.name || 'Wedding'}{(event.wedding_date || event.event_date) ? ` · ${formatDate(event.wedding_date || event.event_date)}` : ''}</span>
                              </label>
                            );
                          })}
                        </div>
                        <p className="text-[11px] text-[#9b91a5] mt-1">The current wedding is always linked to this client record.</p>
                      </div>
                      <textarea value={clientNotes} onChange={(e) => setClientNotes(e.target.value)} placeholder="Private notes, preferences or requirements" rows="3" className="md:col-span-2 rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button type="button" onClick={editingClientId ? updateClient : saveClient} disabled={savingClient || !clientName.trim()} className="rounded-xl bg-[#8B6AA8] px-4 py-2 text-sm font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed">
                        {savingClient ? 'Saving...' : editingClientId ? 'Update Client' : 'Save Client'}
                      </button>
                      <button type="button" onClick={resetClientForm} className="rounded-xl px-4 py-2 text-sm text-[#8B8194]">Cancel</button>
                    </div>
                  </div>
                )}

                {clientsLoading ? (
                  <div className="mt-5 rounded-xl border border-[#eadff2] bg-white p-6 text-center text-sm text-[#8B8194]">Loading client book...</div>
                ) : clients.length === 0 ? (
                  <div className="mt-5 rounded-xl border border-dashed border-[#eadff2] bg-white p-6 text-center text-sm text-[#8B8194]">No clients saved yet. Add a client to start the CRM.</div>
                ) : (
                  <div className="mt-5 space-y-4">
                    {clients.map((client) => {
                      const clientEvents = Array.isArray(client.weddings) ? client.weddings : [];
                      const conversations = Array.isArray(client.communications) ? client.communications : [];
                      const draft = communicationDrafts[client.id] || { channel: 'Note', message: '' };
                      const history = clientHistory[client.id];
                      return (
                        <article key={client.id} className="rounded-xl border border-[#eadff2] bg-white p-4 md:p-5">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h5 className="text-base font-semibold text-[#3F3748]">{client.name}</h5>
                                {client.relation && <span className="text-xs text-[#8B8194]">{client.relation}</span>}
                                <span className="rounded-full bg-[#f4eafa] px-2.5 py-1 text-xs text-[#76588f]">{client.status || 'Lead'}</span>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#6B6175]">
                                {client.phone && <a href={`tel:${client.phone}`} className="inline-flex items-center gap-1.5 hover:text-[#8B6AA8]"><Phone className="w-3.5 h-3.5" />{client.phone}</a>}
                                {client.email && <a href={`mailto:${client.email}`} className="inline-flex items-center gap-1.5 hover:text-[#8B6AA8]"><Mail className="w-3.5 h-3.5" />{client.email}</a>}
                                {client.whatsapp && <a href={`https://wa.me/${String(client.whatsapp).replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-[#8B6AA8]"><MessageCircle className="w-3.5 h-3.5" />WhatsApp</a>}
                              </div>
                              {client.follow_up_date && <p className="mt-2 text-xs text-[#8B6AA8]">Follow up: {formatDate(client.follow_up_date)}</p>}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <select aria-label={`Update ${client.name} status`} value={client.status || 'Lead'} onChange={(e) => updateClientStatus(client.id, e.target.value)} className="rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-xs text-[#6B6175] outline-none">
                                {['Lead', 'Discussion', 'Confirmed', 'Completed'].map((status) => <option key={status}>{status}</option>)}
                              </select>
                              <button type="button" onClick={() => {
                                setEditingClientId(client.id);
                                setClientName(client.name || '');
                                setClientPhone(client.phone || '');
                                setClientWhatsapp(client.whatsapp || '');
                                setClientEmail(client.email || '');
                                setClientRelation(client.relation || '');
                                setClientNotes(client.notes || '');
                                setClientStatus(client.status || 'Lead');
                                setClientFollowUpDate(client.follow_up_date || '');
                                setClientWeddingIds(client.wedding_ids || [wedding.id]);
                                setShowClientForm(true);
                              }} className="rounded-lg bg-[#f4eafa] px-3 py-2 text-sm text-[#8B6AA8]">Edit profile</button>
                            </div>
                          </div>

                          {clientEvents.length > 0 && (
                            <div className="mt-4">
                              <p className="text-xs font-medium uppercase tracking-wide text-[#9a8da6]">Linked weddings / events</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {clientEvents.map((event) => <span key={event.id} className="rounded-full border border-[#eadff2] bg-[#fcf9ff] px-3 py-1.5 text-xs text-[#655a70]">{event.wedding_name}{event.wedding_date ? ` · ${formatDate(event.wedding_date)}` : ''}</span>)}
                              </div>
                            </div>
                          )}
                          {client.notes && <p className="mt-3 rounded-lg bg-[#faf7ff] px-3 py-2 text-sm text-[#6B6175]"><span className="font-medium text-[#5b5266]">Notes: </span>{client.notes}</p>}

                          <div className="mt-4 border-t border-[#f0e8f5] pt-4">
                            <p className="text-sm font-medium text-[#3F3748]">Communication history</p>
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-[150px_1fr_auto] gap-2">
                              <select value={draft.channel || 'Note'} onChange={(e) => updateCommunicationDraft(client.id, 'channel', e.target.value)} className="rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none">
                                {['Note', 'Phone', 'WhatsApp', 'Email', 'Meeting', 'Other'].map((channel) => <option key={channel}>{channel}</option>)}
                              </select>
                              <input value={draft.message || ''} onChange={(e) => updateCommunicationDraft(client.id, 'message', e.target.value)} placeholder="Log a call, message, meeting or client update" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                              <button type="button" onClick={() => saveClientCommunication(client.id)} disabled={!String(draft.message || '').trim() || savingCommunicationId === client.id} className="rounded-lg bg-[#8B6AA8] px-3 py-2 text-sm text-white disabled:opacity-50">{savingCommunicationId === client.id ? 'Saving...' : 'Add note'}</button>
                            </div>
                            {conversations.length > 0 ? (
                              <div className="mt-3 space-y-2">
                                {conversations.slice(0, 5).map((entry) => <div key={entry.id} className="rounded-lg bg-[#fcf9ff] px-3 py-2"><p className="text-xs text-[#8B6AA8]">{entry.channel || 'Note'} · {entry.logged_at ? formatDate(entry.logged_at) : 'Date not set'}</p><p className="mt-1 text-sm text-[#5d5367] whitespace-pre-wrap">{entry.message}</p></div>)}
                              </div>
                            ) : <p className="mt-2 text-xs text-[#9b91a5]">No communication notes logged yet.</p>}
                          </div>

                          <div className="mt-4 border-t border-[#f0e8f5] pt-3">
                            <button type="button" onClick={() => toggleClientHistory(client.id)} className="text-sm font-medium text-[#8B6AA8] hover:text-[#6B4F82]">
                              {expandedClientHistoryId === client.id ? 'Hide' : 'Show'} linked documents & payment history
                            </button>
                            <p className="mt-1 text-xs text-[#9b91a5]">These records come from the client’s linked weddings.</p>
                            {expandedClientHistoryId === client.id && (
                              clientHistoryLoadingId === client.id ? <p className="mt-3 text-sm text-[#8B8194]">Loading history...</p> : (
                                <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                                  <div className="rounded-lg border border-[#eadff2] bg-[#fcf9ff] p-3">
                                    <p className="text-sm font-medium text-[#3F3748]">Documents ({history?.documents?.length || 0})</p>
                                    {history?.documents?.length ? <div className="mt-2 space-y-2">{history.documents.slice(0, 8).map((doc) => <div key={doc.id} className="text-xs text-[#6B6175]"><span className="font-medium">{doc.title || doc.file_name}</span><span className="block text-[#9b91a5]">{doc.wedding_name} · {doc.category || 'Document'}</span></div>)}</div> : <p className="mt-2 text-xs text-[#9b91a5]">No documents on the linked weddings.</p>}
                                  </div>
                                  <div className="rounded-lg border border-[#eadff2] bg-[#fcf9ff] p-3">
                                    <p className="text-sm font-medium text-[#3F3748]">Payment history ({history?.payments?.length || 0})</p>
                                    {history?.payments?.length ? <div className="mt-2 space-y-2">{history.payments.slice(0, 8).map((payment) => <div key={payment.id} className="flex items-start justify-between gap-3 text-xs text-[#6B6175]"><span><span className="font-medium">{payment.title}</span><span className="block text-[#9b91a5]">{payment.wedding_name} · {payment.payment_type}{payment.payment_date ? ` · ${formatDate(payment.payment_date)}` : ''}</span></span><span className="shrink-0 font-medium">{formatCurrency(payment.amount)}</span></div>)}</div> : <p className="mt-2 text-xs text-[#9b91a5]">No payments on the linked weddings.</p>}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* OVERVIEW MODULE */}
            {activeModule === "Overview" && (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-sm text-[#8B8194]">Wedding Countdown</p>
                      <h4 className="text-lg font-semibold text-[#3F3748] mt-1">
                        {weddingCountdown?.isToday
                          ? "The Wedding Day is Today"
                          : weddingCountdown?.isPast
                          ? "Wedding Day Has Passed"
                          : `${weddingCountdown?.days ?? "—"} Days To Go`}
                      </h4>
                      <p className="text-sm text-[#6B6175] mt-1">
                        {wedding?.wedding_date
                          ? `Counting down to ${formatDate(wedding.wedding_date)}`
                          : "Add a wedding date to start the countdown."}
                      </p>
                    </div>

                    <div className="min-w-[150px] rounded-xl border border-[#eadff2] bg-white px-5 py-4 text-center">
                      <p className="text-3xl font-semibold text-[#8B6AA8]">
                        {weddingCountdown ? Math.abs(weddingCountdown.days) : "—"}
                      </p>
                      <p className="text-xs text-[#8B8194] mt-1">
                        {weddingCountdown?.isToday
                          ? "Today"
                          : weddingCountdown?.isPast
                          ? "Days since"
                          : "Days remaining"}
                      </p>
                    </div>
                  </div>
                </div>

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

            {/* QUOTATIONS MODULE */}
            {activeModule === "Quotations" && (
              <div className="mt-4 space-y-5" data-testid="wedding-quotations">
                <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm text-[#8B8194]">Client Estimates</p>
                    <h4 className="text-lg font-semibold text-[#3F3748] mt-1">Wedding Quotations</h4>
                    <p className="text-sm text-[#6B6175] mt-1">Add line items, discount, tax, advance and terms. Print or save a quotation as PDF.</p>
                  </div>
                  <button type="button" onClick={() => { setQuotationForm(emptyQuotation(wedding)); setEditingQuotationId(null); setShowQuotationForm(true); }} className="rounded-xl bg-[#f4eafa] px-4 py-2 text-sm font-medium text-[#8B6AA8] hover:bg-[#eadcf5]"><Plus className="inline w-4 h-4 mr-1" />New Quotation</button>
                </div>

                {showQuotationForm && (
                  <div className="rounded-xl border border-[#eadff2] bg-white p-5 space-y-4" data-testid="quotation-form">
                    <div className="flex items-center justify-between gap-3"><div><p className="text-sm text-[#8B8194]">{editingQuotationId ? 'Update saved quotation' : 'New quotation'}</p><h4 className="text-lg font-semibold text-[#3F3748] mt-1">Quotation Details</h4></div><button type="button" onClick={resetQuotationForm} className="rounded-xl px-3 py-2 text-sm text-[#8B8194]">Close</button></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="text-xs text-[#8B8194]">Quotation title<input value={quotationForm.title} onChange={(event) => setQuotationForm({ ...quotationForm, title: event.target.value })} maxLength={160} className="mt-1 w-full rounded-lg border border-[#eadff2] px-3 py-2 text-sm text-[#3F3748]" placeholder="Wedding services quotation" /></label>
                      <label className="text-xs text-[#8B8194]">Client name<input value={quotationForm.client_name} onChange={(event) => setQuotationForm({ ...quotationForm, client_name: event.target.value })} maxLength={160} className="mt-1 w-full rounded-lg border border-[#eadff2] px-3 py-2 text-sm text-[#3F3748]" placeholder="Client name" /></label>
                      <label className="text-xs text-[#8B8194]">Issue date<input type="date" value={quotationForm.issue_date || ''} onChange={(event) => setQuotationForm({ ...quotationForm, issue_date: event.target.value })} className="mt-1 w-full rounded-lg border border-[#eadff2] px-3 py-2 text-sm text-[#3F3748]" /></label>
                      <label className="text-xs text-[#8B8194]">Valid until<input type="date" value={quotationForm.valid_until || ''} onChange={(event) => setQuotationForm({ ...quotationForm, valid_until: event.target.value })} className="mt-1 w-full rounded-lg border border-[#eadff2] px-3 py-2 text-sm text-[#3F3748]" /></label>
                    </div>

                    <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4">
                      <div className="flex items-center justify-between gap-3 mb-3"><div><p className="text-sm font-semibold text-[#3F3748]">Line Items</p><p className="text-xs text-[#8B8194] mt-1">Add each service or product and its price.</p></div><button type="button" onClick={() => setQuotationForm({ ...quotationForm, line_items: [...quotationForm.line_items, { description: '', quantity: '1', unit: 'service', unit_price: '' }] })} className="rounded-lg bg-white px-3 py-2 text-xs text-[#8B6AA8]"><Plus className="inline w-3.5 h-3.5 mr-1" />Add line</button></div>
                      <div className="space-y-2">
                        {quotationForm.line_items.map((item, index) => (
                          <div key={index} className="grid grid-cols-1 sm:grid-cols-[minmax(160px,1fr)_90px_100px_130px_40px] gap-2 items-center">
                            <input value={item.description} onChange={(event) => updateQuotationLine(index, 'description', event.target.value)} maxLength={240} placeholder="Description" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm" />
                            <input type="number" min="0.001" step="0.001" value={item.quantity} onChange={(event) => updateQuotationLine(index, 'quantity', event.target.value)} placeholder="Qty" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm" />
                            <input value={item.unit} onChange={(event) => updateQuotationLine(index, 'unit', event.target.value)} maxLength={40} placeholder="Unit" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm" />
                            <input type="number" min="0" step="0.01" value={item.unit_price} onChange={(event) => updateQuotationLine(index, 'unit_price', event.target.value)} placeholder="Price (₹)" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm" />
                            <button type="button" aria-label="Remove line item" disabled={quotationForm.line_items.length <= 1} onClick={() => setQuotationForm({ ...quotationForm, line_items: quotationForm.line_items.filter((_, itemIndex) => itemIndex !== index) })} className="rounded-lg bg-[#fff1f4] px-2 py-2 text-red-400 disabled:opacity-40"><Trash2 className="w-4 h-4 mx-auto" /></button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-xs text-[#8B8194]">Discount type<select value={quotationForm.discount_type} onChange={(event) => setQuotationForm({ ...quotationForm, discount_type: event.target.value })} className="mt-1 w-full rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm"><option value="amount">Fixed amount (₹)</option><option value="percent">Percentage (%)</option></select></label>
                        <label className="text-xs text-[#8B8194]">Discount<input type="number" min="0" step="0.01" value={quotationForm.discount_value} onChange={(event) => setQuotationForm({ ...quotationForm, discount_value: event.target.value })} className="mt-1 w-full rounded-lg border border-[#eadff2] px-3 py-2 text-sm" /></label>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-xs text-[#8B8194]">Tax (%)<input type="number" min="0" max="100" step="0.01" value={quotationForm.tax_percent} onChange={(event) => setQuotationForm({ ...quotationForm, tax_percent: event.target.value })} className="mt-1 w-full rounded-lg border border-[#eadff2] px-3 py-2 text-sm" /></label>
                        <label className="text-xs text-[#8B8194]">Advance (₹)<input type="number" min="0" step="0.01" value={quotationForm.advance_amount} onChange={(event) => setQuotationForm({ ...quotationForm, advance_amount: event.target.value })} className="mt-1 w-full rounded-lg border border-[#eadff2] px-3 py-2 text-sm" /></label>
                      </div>
                      <label className="text-xs text-[#8B8194] md:col-span-2">Terms<textarea rows="3" maxLength={5000} value={quotationForm.terms} onChange={(event) => setQuotationForm({ ...quotationForm, terms: event.target.value })} placeholder="Payment schedule, inclusions, cancellation or other terms" className="mt-1 w-full rounded-lg border border-[#eadff2] px-3 py-2 text-sm" /></label>
                      <label className="text-xs text-[#8B8194] md:col-span-2">Notes<textarea rows="2" maxLength={2000} value={quotationForm.notes} onChange={(event) => setQuotationForm({ ...quotationForm, notes: event.target.value })} className="mt-1 w-full rounded-lg border border-[#eadff2] px-3 py-2 text-sm" /></label>
                    </div>

                    <div className="ml-auto max-w-sm rounded-xl bg-[#faf7ff] p-4 space-y-1 text-sm">
                      <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(quotationSubtotal)}</span></div>
                      <div className="flex justify-between"><span>Discount</span><span>− {formatCurrency(Math.min(quotationDiscount, quotationSubtotal))}</span></div>
                      <div className="flex justify-between"><span>Tax ({Number(quotationForm.tax_percent) || 0}%)</span><span>{formatCurrency(quotationTax)}</span></div>
                      <div className="flex justify-between border-t border-[#eadff2] pt-2 font-semibold"><span>Total</span><span>{formatCurrency(quotationTotal)}</span></div>
                      <div className="flex justify-between"><span>Advance</span><span>{formatCurrency(quotationForm.advance_amount)}</span></div>
                      <div className="flex justify-between font-medium"><span>Balance</span><span>{formatCurrency(quotationBalance)}</span></div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end"><button type="button" onClick={resetQuotationForm} className="rounded-xl px-4 py-2 text-sm text-[#8B8194]">Cancel</button><button type="button" onClick={saveQuotation} disabled={quotationSaving} className="rounded-xl bg-[#8B6AA8] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{quotationSaving ? 'Saving...' : editingQuotationId ? 'Update Quotation' : 'Save Quotation'}</button></div>
                  </div>
                )}

                <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                  <div className="flex items-center justify-between"><div><p className="text-sm text-[#8B8194]">Saved for this wedding</p><h4 className="text-lg font-semibold text-[#3F3748] mt-1">Your Quotations</h4></div><span className="text-sm text-[#8B8194]">{quotations.length}</span></div>
                  {quotationsLoading ? <p className="mt-4 text-sm text-[#8B8194]">Loading quotations...</p> : quotations.length ? (
                    <div className="mt-4 space-y-3">
                      {quotations.map((quotation) => (
                        <div key={quotation.id} className="rounded-xl border border-[#eadff2] bg-white p-4 flex flex-col md:flex-row md:items-center gap-3">
                          <div className="flex-1 min-w-0"><p className="text-sm font-medium text-[#3F3748]">{quotation.title || 'Quotation'}</p><p className="text-xs text-[#8B8194] mt-1">{quotation.client_name || 'No client name'} · {quotation.line_items?.length || 0} line items{quotation.valid_until ? ` · Valid until ${quotation.valid_until}` : ''}</p><p className="text-xs text-[#8B8194] mt-1">Total {formatCurrency(quotation.total)} · Advance {formatCurrency(quotation.advance_amount)} · Balance {formatCurrency(quotation.balance_amount)}</p></div>
                          <div className="flex flex-wrap gap-2"><button type="button" onClick={() => printQuotation(quotation)} className="rounded-lg bg-[#eaf7ff] px-3 py-1.5 text-sm text-[#557c9a]"><Download className="inline w-3.5 h-3.5 mr-1" />PDF</button><button type="button" onClick={() => editQuotation(quotation)} className="rounded-lg bg-[#f4eafa] px-3 py-1.5 text-sm text-[#8B6AA8]"><Edit3 className="inline w-3.5 h-3.5 mr-1" />Edit</button><button type="button" onClick={() => deleteQuotation(quotation.id)} className="rounded-lg bg-[#fff1f4] px-3 py-1.5 text-sm text-red-400"><Trash2 className="inline w-3.5 h-3.5 mr-1" />Delete</button></div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="mt-4 text-sm text-[#8B8194]">No quotations saved for this wedding yet.</p>}
                </div>
              </div>
            )}

            {/* INVOICES & RECEIPTS MODULE */}
            {activeModule === "Invoices & Receipts" && (
              <div className="mt-4 space-y-5" data-testid="wedding-invoices">
                <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div><p className="text-sm text-[#8B8194]">Billing</p><h4 className="text-lg font-semibold text-[#3F3748] mt-1">Invoices & Receipts</h4><p className="text-sm text-[#6B6175] mt-1">Create invoices, track full or partial payments and print receipts.</p></div>
                  <button type="button" onClick={() => { setInvoiceForm(emptyInvoice(wedding)); setEditingInvoiceId(null); setShowInvoiceForm(true); }} className="rounded-xl bg-[#f4eafa] px-4 py-2 text-sm font-medium text-[#8B6AA8] hover:bg-[#eadcf5]"><Plus className="inline w-4 h-4 mr-1" />New Invoice</button>
                </div>

                {showInvoiceForm && (
                  <div className="rounded-xl border border-[#eadff2] bg-white p-5 space-y-4" data-testid="invoice-form">
                    <div className="flex items-center justify-between gap-3"><div><p className="text-sm text-[#8B8194]">{editingInvoiceId ? 'Update invoice details' : 'New invoice'}</p><h4 className="text-lg font-semibold text-[#3F3748] mt-1">Invoice Details</h4></div><button type="button" onClick={resetInvoiceForm} className="rounded-xl px-3 py-2 text-sm text-[#8B8194]">Close</button></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="text-xs text-[#8B8194]">Invoice title<input value={invoiceForm.title} onChange={(event) => setInvoiceForm({ ...invoiceForm, title: event.target.value })} maxLength={160} className="mt-1 w-full rounded-lg border border-[#eadff2] px-3 py-2 text-sm text-[#3F3748]" placeholder="Wedding services invoice" /></label>
                      <label className="text-xs text-[#8B8194]">Client name<input value={invoiceForm.client_name} onChange={(event) => setInvoiceForm({ ...invoiceForm, client_name: event.target.value })} maxLength={160} className="mt-1 w-full rounded-lg border border-[#eadff2] px-3 py-2 text-sm text-[#3F3748]" placeholder="Client name" /></label>
                      <label className="text-xs text-[#8B8194]">Issue date<input type="date" value={invoiceForm.issue_date || ''} onChange={(event) => setInvoiceForm({ ...invoiceForm, issue_date: event.target.value })} className="mt-1 w-full rounded-lg border border-[#eadff2] px-3 py-2 text-sm text-[#3F3748]" /></label>
                      <label className="text-xs text-[#8B8194]">Payment due date<input type="date" value={invoiceForm.due_date || ''} onChange={(event) => setInvoiceForm({ ...invoiceForm, due_date: event.target.value })} className="mt-1 w-full rounded-lg border border-[#eadff2] px-3 py-2 text-sm text-[#3F3748]" /></label>
                    </div>

                    <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4">
                      <div className="flex items-center justify-between gap-3 mb-3"><div><p className="text-sm font-semibold text-[#3F3748]">Line Items</p><p className="text-xs text-[#8B8194] mt-1">Add the services or products included on this invoice.</p></div><button type="button" onClick={() => setInvoiceForm({ ...invoiceForm, line_items: [...invoiceForm.line_items, { description: '', quantity: '1', unit: 'service', unit_price: '' }] })} className="rounded-lg bg-white px-3 py-2 text-xs text-[#8B6AA8]"><Plus className="inline w-3.5 h-3.5 mr-1" />Add line</button></div>
                      <div className="space-y-2">
                        {invoiceForm.line_items.map((item, index) => (
                          <div key={index} className="grid grid-cols-1 sm:grid-cols-[minmax(160px,1fr)_90px_100px_130px_40px] gap-2 items-center">
                            <input value={item.description} onChange={(event) => updateInvoiceLine(index, 'description', event.target.value)} maxLength={240} placeholder="Description" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm" />
                            <input type="number" min="0.001" step="0.001" value={item.quantity} onChange={(event) => updateInvoiceLine(index, 'quantity', event.target.value)} placeholder="Qty" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm" />
                            <input value={item.unit} onChange={(event) => updateInvoiceLine(index, 'unit', event.target.value)} maxLength={40} placeholder="Unit" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm" />
                            <input type="number" min="0" step="0.01" value={item.unit_price} onChange={(event) => updateInvoiceLine(index, 'unit_price', event.target.value)} placeholder="Price (₹)" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm" />
                            <button type="button" aria-label="Remove invoice line item" disabled={invoiceForm.line_items.length <= 1} onClick={() => setInvoiceForm({ ...invoiceForm, line_items: invoiceForm.line_items.filter((_, itemIndex) => itemIndex !== index) })} className="rounded-lg bg-[#fff1f4] px-2 py-2 text-red-400 disabled:opacity-40"><Trash2 className="w-4 h-4 mx-auto" /></button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-xs text-[#8B8194]">Discount type<select value={invoiceForm.discount_type} onChange={(event) => setInvoiceForm({ ...invoiceForm, discount_type: event.target.value })} className="mt-1 w-full rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm"><option value="amount">Fixed amount (₹)</option><option value="percent">Percentage (%)</option></select></label>
                        <label className="text-xs text-[#8B8194]">Discount<input type="number" min="0" step="0.01" value={invoiceForm.discount_value} onChange={(event) => setInvoiceForm({ ...invoiceForm, discount_value: event.target.value })} className="mt-1 w-full rounded-lg border border-[#eadff2] px-3 py-2 text-sm" /></label>
                      </div>
                      <label className="text-xs text-[#8B8194]">Tax (%)<input type="number" min="0" max="100" step="0.01" value={invoiceForm.tax_percent} onChange={(event) => setInvoiceForm({ ...invoiceForm, tax_percent: event.target.value })} className="mt-1 w-full rounded-lg border border-[#eadff2] px-3 py-2 text-sm" /></label>
                      <label className="text-xs text-[#8B8194] md:col-span-2">Terms<textarea rows="3" maxLength={5000} value={invoiceForm.terms} onChange={(event) => setInvoiceForm({ ...invoiceForm, terms: event.target.value })} placeholder="Payment terms and conditions" className="mt-1 w-full rounded-lg border border-[#eadff2] px-3 py-2 text-sm" /></label>
                      <label className="text-xs text-[#8B8194] md:col-span-2">Notes<textarea rows="2" maxLength={2000} value={invoiceForm.notes} onChange={(event) => setInvoiceForm({ ...invoiceForm, notes: event.target.value })} className="mt-1 w-full rounded-lg border border-[#eadff2] px-3 py-2 text-sm" /></label>
                    </div>

                    <div className="ml-auto max-w-sm rounded-xl bg-[#faf7ff] p-4 space-y-1 text-sm">
                      <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(invoiceDraftSubtotal)}</span></div>
                      <div className="flex justify-between"><span>Discount</span><span>− {formatCurrency(Math.min(invoiceDraftDiscount, invoiceDraftSubtotal))}</span></div>
                      <div className="flex justify-between"><span>Tax ({Number(invoiceForm.tax_percent) || 0}%)</span><span>{formatCurrency(invoiceDraftTax)}</span></div>
                      <div className="flex justify-between border-t border-[#eadff2] pt-2 font-semibold"><span>Total</span><span>{formatCurrency(invoiceDraftTotal)}</span></div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end"><button type="button" onClick={resetInvoiceForm} className="rounded-xl px-4 py-2 text-sm text-[#8B8194]">Cancel</button><button type="button" onClick={saveInvoice} disabled={invoiceSaving} className="rounded-xl bg-[#8B6AA8] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{invoiceSaving ? 'Saving...' : editingInvoiceId ? 'Update Invoice' : 'Save Invoice'}</button></div>
                  </div>
                )}

                <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                  <div className="flex items-center justify-between"><div><p className="text-sm text-[#8B8194]">Saved for this wedding</p><h4 className="text-lg font-semibold text-[#3F3748] mt-1">Your Invoices</h4></div><span className="text-sm text-[#8B8194]">{invoices.length}</span></div>
                  {invoicesLoading ? <p className="mt-4 text-sm text-[#8B8194]">Loading invoices...</p> : invoices.length ? (
                    <div className="mt-4 space-y-3">
                      {invoices.map((invoice) => (
                        <div key={invoice.id} className="rounded-xl border border-[#eadff2] bg-white p-4">
                          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                            <div className="flex-1 min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-[#3F3748]">{invoice.title || 'Invoice'}</p><span className={`rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${invoice.status === 'paid' ? 'bg-green-50 text-green-700' : invoice.status === 'partial' ? 'bg-amber-50 text-amber-700' : 'bg-[#fff1f4] text-[#b25b70]'}`}>{invoice.status || 'unpaid'}</span></div><p className="text-xs text-[#8B8194] mt-1">{invoice.invoice_number} · {invoice.client_name || 'No client name'}{invoice.due_date ? ` · Due ${invoice.due_date}` : ''}</p><p className="text-xs text-[#8B8194] mt-1">Total {formatCurrency(invoice.total)} · Paid {formatCurrency(invoice.paid_amount)} · Balance {formatCurrency(invoice.balance_amount)}</p></div>
                            <div className="flex flex-wrap gap-2"><button type="button" onClick={() => printInvoice(invoice)} className="rounded-lg bg-[#eaf7ff] px-3 py-1.5 text-sm text-[#557c9a]"><Download className="inline w-3.5 h-3.5 mr-1" />PDF</button>{Number(invoice.balance_amount) > 0 && <button type="button" onClick={() => startInvoicePayment(invoice)} className="rounded-lg bg-[#eef8ef] px-3 py-1.5 text-sm text-green-700"><Plus className="inline w-3.5 h-3.5 mr-1" />Record payment</button>}<button type="button" onClick={() => editInvoice(invoice)} className="rounded-lg bg-[#f4eafa] px-3 py-1.5 text-sm text-[#8B6AA8]"><Edit3 className="inline w-3.5 h-3.5 mr-1" />Edit</button><button type="button" onClick={() => deleteInvoice(invoice.id)} className="rounded-lg bg-[#fff1f4] px-3 py-1.5 text-sm text-red-400"><Trash2 className="inline w-3.5 h-3.5 mr-1" />Delete</button></div>
                          </div>

                          {payingInvoiceId === invoice.id && (
                            <div className="mt-4 rounded-xl border border-[#dcefe0] bg-[#f7fcf7] p-4">
                              <p className="text-sm font-medium text-[#3F3748]">Record a payment</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-3">
                                <input type="number" min="0.01" step="0.01" max={invoice.balance_amount} value={invoicePaymentForm.amount} onChange={(event) => setInvoicePaymentForm({ ...invoicePaymentForm, amount: event.target.value })} placeholder="Amount received" className="rounded-lg border border-[#dcefe0] px-3 py-2 text-sm" />
                                <input type="date" value={invoicePaymentForm.payment_date} onChange={(event) => setInvoicePaymentForm({ ...invoicePaymentForm, payment_date: event.target.value })} className="rounded-lg border border-[#dcefe0] px-3 py-2 text-sm" />
                                <select value={invoicePaymentForm.payment_method} onChange={(event) => setInvoicePaymentForm({ ...invoicePaymentForm, payment_method: event.target.value })} className="rounded-lg border border-[#dcefe0] bg-white px-3 py-2 text-sm"><option>Other</option><option>Cash</option><option>UPI</option><option>Bank transfer</option><option>Card</option><option>Cheque</option></select>
                                <input value={invoicePaymentForm.notes} onChange={(event) => setInvoicePaymentForm({ ...invoicePaymentForm, notes: event.target.value })} placeholder="Payment note (optional)" className="rounded-lg border border-[#dcefe0] px-3 py-2 text-sm" />
                              </div>
                              <div className="flex gap-2 justify-end mt-3"><button type="button" onClick={() => setPayingInvoiceId(null)} className="rounded-lg px-3 py-2 text-sm text-[#8B8194]">Cancel</button><button type="button" disabled={invoicePaymentSaving} onClick={() => recordInvoicePayment(invoice)} className="rounded-lg bg-[#6d9a73] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{invoicePaymentSaving ? 'Saving...' : 'Save payment'}</button></div>
                            </div>
                          )}

                          {Array.isArray(invoice.payments) && invoice.payments.length > 0 && (
                            <div className="mt-4 border-t border-[#f0e8f5] pt-3"><p className="text-xs font-medium text-[#6B6175] mb-2">Receipts</p><div className="space-y-2">{invoice.payments.map((receipt) => <div key={receipt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg bg-[#faf7ff] px-3 py-2"><p className="text-xs text-[#6B6175]">{receipt.receipt_number} · {receipt.payment_date || 'Date not set'} · {receipt.payment_method || 'Other'} · {formatCurrency(receipt.amount)}</p><button type="button" onClick={() => printReceipt(invoice, receipt)} className="rounded-lg bg-white px-3 py-1.5 text-xs text-[#557c9a]"><Download className="inline w-3.5 h-3.5 mr-1" />Receipt PDF</button></div>)}</div></div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : <p className="mt-4 text-sm text-[#8B8194]">No invoices saved for this wedding yet.</p>}
                </div>
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
              !hasPaidAI ? (
                <div className="mt-4 rounded-xl border border-[#eadff2] bg-[#faf7ff] p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                    <div>
                      <p className="text-sm text-[#8B8194]">Premium Wedding Intelligence</p>
                      <h4 className="text-lg font-semibold text-[#3F3748] mt-1">Wedding AI Assistant</h4>
                      <p className="text-sm text-[#6B6175] mt-2 max-w-2xl">
                        AI assistance is available for subscribed WEDORA vendors. Upgrade to PRO to use category-specific wedding intelligence for your business.
                      </p>
                    </div>
                    <div className="shrink-0 rounded-xl bg-[#f4eafa] px-4 py-3 text-sm font-medium text-[#8B6AA8]">
                      PRO
                    </div>
                  </div>
                </div>
              ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#f4eafa] flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-[#8B6AA8]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#8B8194]">Wedding Intelligence</p>
                      <h4 className="text-lg font-semibold text-[#3F3748] mt-1">Wedding AI Assistant</h4>
                      <p className="text-sm text-[#6B6175] mt-1">
                        Ask WEDORA about planning, timelines, budget ideas, decor, sourcing, vendors or this wedding.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[#eadff2] bg-white overflow-hidden">
                  <div className="max-h-[420px] overflow-y-auto p-4 space-y-3">
                    {aiMessages.length === 0 ? (
                      <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                        <p className="text-sm font-medium text-[#3F3748]">What can I help with?</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                          {[
                            "Create a wedding planning timeline",
                            "Help me control the wedding budget",
                            "Suggest ideas relevant to my vendor category",
                            "What should I discuss with my client next?",
                          ].map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => setAiInput(suggestion)}
                              className="text-left rounded-xl border border-[#eadff2] bg-white px-3 py-3 text-sm text-[#6B6175] hover:bg-[#faf7ff] hover:border-[#d9c7e6] transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      aiMessages.map((message, index) => (
                        <div
                          key={`${message.role}-${index}`}
                          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                              message.role === "user"
                                ? "bg-[#8B6AA8] text-white"
                                : "bg-[#faf7ff] border border-[#eadff2] text-[#3F3748]"
                            }`}
                          >
                            {message.content}
                          </div>
                        </div>
                      ))
                    )}

                    {aiLoading && (
                      <div className="flex justify-start">
                        <div className="rounded-2xl bg-[#faf7ff] border border-[#eadff2] px-4 py-3 text-sm text-[#8B8194]">
                          WEDORA is thinking...
                        </div>
                      </div>
                    )}
                  </div>

                  {aiError && (
                    <div className="px-4 pb-2 text-sm text-red-400">
                      {aiError}
                    </div>
                  )}

                  <div className="border-t border-[#eadff2] p-4 bg-[#faf7ff]">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <textarea
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendWeddingAiMessage();
                          }
                        }}
                        rows="3"
                        placeholder="Ask WEDORA anything about this wedding..."
                        className="flex-1 rounded-xl border border-[#eadff2] bg-white px-3 py-3 text-sm text-[#3F3748] outline-none focus:border-[#c9a9df] resize-none"
                      />
                      <button
                        type="button"
                        onClick={sendWeddingAiMessage}
                        disabled={!aiInput.trim() || aiLoading}
                        className="sm:self-end rounded-xl bg-[#8B6AA8] px-5 py-3 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {aiLoading ? "Thinking..." : "Ask WEDORA"}
                      </button>
                    </div>
                    <p className="text-xs text-[#8B8194] mt-2">
                      Enter to send · Shift + Enter for a new line
                    </p>
                  </div>
                </div>
              </div>
              )
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
                      <p className="text-sm text-[#6B6175] mt-1">
                        Manage decor materials, dimensions, quantity, pricing, suppliers and execution requirements.
                      </p>
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

                {/* ELEMENT SUMMARY */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4">
                    <p className="text-xs text-[#8B8194]">Total Elements</p>
                    <p className="text-xl font-semibold text-[#3F3748] mt-1">{elementSummary.total_elements}</p>
                  </div>
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4">
                    <p className="text-xs text-[#8B8194]">Ordered</p>
                    <p className="text-xl font-semibold text-[#3F3748] mt-1">{elementSummary.ordered_elements}</p>
                  </div>
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4">
                    <p className="text-xs text-[#8B8194]">Pending</p>
                    <p className="text-xl font-semibold text-[#3F3748] mt-1">{elementSummary.pending_elements}</p>
                  </div>
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4">
                    <p className="text-xs text-[#8B8194]">Estimated Cost</p>
                    <p className="text-lg font-semibold text-[#3F3748] mt-1">{formatElementCurrency(elementSummary.estimated_cost)}</p>
                  </div>
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4">
                    <p className="text-xs text-[#8B8194]">Actual Cost</p>
                    <p className="text-lg font-semibold text-[#3F3748] mt-1">{formatElementCurrency(elementSummary.actual_cost)}</p>
                  </div>
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4">
                    <p className="text-xs text-[#8B8194]">Cost Variance</p>
                    <p className="text-lg font-semibold text-[#3F3748] mt-1">
                      {elementCostVariance > 0
                        ? `+${formatElementCurrency(elementCostVariance)}`
                        : formatElementCurrency(elementCostVariance)}
                    </p>
                    <p className="text-[11px] text-[#8B8194] mt-1">
                      {elementSummary.actual_cost > 0
                        ? elementCostVariance > 0
                          ? 'Saving vs estimate'
                          : elementCostVariance < 0
                            ? 'Over estimate'
                            : 'On estimate'
                        : 'Actual cost pending'}
                    </p>
                  </div>
                </div>

                {showElementForm && (
                  <div id="wedding-element-form" className="rounded-xl border border-[#eadff2] bg-white p-5">
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

                      {elementForm.category !== 'Custom' && (
                        <div className="md:col-span-2 rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4">
                          <p className="text-sm font-medium text-[#3F3748]">
                            {elementForm.category === 'General' ? 'Common Decor Items' : `${elementForm.category} Items`}
                          </p>
                          <p className="text-xs text-[#8B8194] mt-1">
                            Quickly select a commonly used {elementForm.category.toLowerCase()} item or type your own below.
                          </p>
                          <select
                            defaultValue=""
                            onChange={(e) => { selectCategoryElement(e.target.value); e.target.value = ''; }}
                            className="mt-3 w-full rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a9df]"
                          >
                            <option value="">Select an item...</option>
                            {(CATEGORY_DECOR_ITEMS[elementForm.category] || CATEGORY_DECOR_ITEMS.General).map((item) => (
                              <option key={item} value={item}>{item}</option>
                            ))}
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
                        placeholder="Quantity unit (pcs, set, ft, etc.)"
                        className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none focus:border-[#c9a9df]"
                      />

                      <input
                        value={elementForm.dimensions}
                        onChange={(e) => setElementForm({ ...elementForm, dimensions: e.target.value })}
                        placeholder="Size (20 × 12, 8 × 4 × 2...)"
                        className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none focus:border-[#c9a9df]"
                      />

                      <select
                        value={elementForm.dimension_unit}
                        onChange={(e) => setElementForm({ ...elementForm, dimension_unit: e.target.value })}
                        className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none bg-white"
                      >
                        <option value="ft">Size Unit: Feet (ft)</option>
                        <option value="m">Size Unit: Metres (m)</option>
                      </select>

                      <div className="rounded-lg border border-[#eadff2] bg-[#faf7ff] px-3 py-2">
                        <p className="text-xs text-[#8B8194]">Calculated Area</p>
                        <p className="text-sm font-semibold text-[#3F3748] mt-1">
                          {parseElementAreaSqft(elementForm.dimensions, elementForm.dimension_unit)
                            ? `${parseElementAreaSqft(elementForm.dimensions, elementForm.dimension_unit)} sq ft`
                            : 'Enter length × width'}
                        </p>
                      </div>

                      <input
                        value={elementForm.area}
                        onChange={(e) => setElementForm({ ...elementForm, area: e.target.value })}
                        placeholder="Area / Location (Mandap, Stage, Entrance...)"
                        className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none focus:border-[#c9a9df]"
                      />

                      <select
                        value={elementForm.function}
                        onChange={(e) => setElementForm({ ...elementForm, function: e.target.value })}
                        className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none bg-white"
                      >
                        {['All Functions', 'Haldi', 'Mehendi', 'Sangeet', 'Wedding', 'Reception', 'Other'].map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>

                      <select
                        value={elementForm.status}
                        onChange={(e) => setElementForm({ ...elementForm, status: e.target.value })}
                        className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none bg-white"
                      >
                        <option value="planned">Planned</option>
                        <option value="quotation">Quotation</option>
                        <option value="ordered">Ordered</option>
                        <option value="received">Received</option>
                        <option value="installed">Installed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="ready">Ready</option>
                        <option value="completed">Completed</option>
                      </select>

                      {/* SOURCING */}
                      <div className="md:col-span-2 rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4">
                        <p className="text-sm font-medium text-[#3F3748]">Sourcing Type</p>
                        <p className="text-xs text-[#8B8194] mt-1">
                          Choose how this element will be arranged for the event.
                        </p>
                        <select
                          value={elementForm.sourcing_type}
                          onChange={(e) => setElementForm({ ...elementForm, sourcing_type: e.target.value })}
                          className="mt-3 w-full rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none"
                        >
                          <option value="unspecified">Not Specified</option>
                          <option value="rent">Rent / Rental Vendor</option>
                          <option value="purchase">Purchase / Buy</option>
                          <option value="own_inventory">Own Inventory</option>
                          <option value="client_provided">Client Provided</option>
                          <option value="vendor_included">Vendor Included</option>
                        </select>
                      </div>

                      {/* PRICING */}
                      <div className="md:col-span-2 rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4">
                        <p className="text-sm font-medium text-[#3F3748]">Pricing</p>
                        <p className="text-xs text-[#8B8194] mt-1">
                          Choose how this element is priced. For platform/carpet/flooring, use Per Sq Ft.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                          <select
                            value={elementForm.pricing_type}
                            onChange={(e) => setElementForm({ ...elementForm, pricing_type: e.target.value })}
                            className="rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none"
                          >
                            <option value="manual">Manual Estimated Cost</option>
                            <option value="per_sqft">Rate Per Sq Ft</option>
                            <option value="per_unit">Rate Per Unit</option>
                          </select>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={elementForm.rate}
                            onChange={(e) => setElementForm({ ...elementForm, rate: e.target.value })}
                            placeholder={elementForm.pricing_type === 'per_sqft' ? 'Rate / sq ft (₹)' : 'Rate (₹)'}
                            className="rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a9df]"
                          />

                          <div className="rounded-lg border border-[#eadff2] bg-white px-3 py-2">
                            <p className="text-xs text-[#8B8194]">Estimated Cost</p>
                            <p className="text-sm font-semibold text-[#3F3748] mt-1">
                              {formatElementCurrency(getElementEstimatedCost(elementForm))}
                            </p>
                          </div>
                        </div>

                        {elementForm.pricing_type === 'per_sqft' && (
                          <div className="mt-3 rounded-lg bg-white border border-[#eadff2] px-3 py-3 text-sm text-[#6B6175]">
                            {parseElementAreaSqft(elementForm.dimensions, elementForm.dimension_unit) > 0 && Number(elementForm.rate) > 0 ? (
                              <>
                                <span className="font-medium text-[#3F3748]">
                                  {parseElementAreaSqft(elementForm.dimensions, elementForm.dimension_unit)} sq ft
                                </span>
                                {' × '}
                                <span className="font-medium text-[#3F3748]">₹{Number(elementForm.rate).toLocaleString('en-IN')}</span>
                                {' / sq ft × '}
                                <span className="font-medium text-[#3F3748]">{Number(elementForm.quantity || 1)}</span>
                                {' = '}
                                <span className="font-semibold text-[#8B6AA8]">
                                  {formatElementCurrency(getElementEstimatedCost(elementForm))}
                                </span>
                              </>
                            ) : (
                              'Enter a size such as 20 × 12 ft and a rate such as ₹27 / sq ft.'
                            )}
                          </div>
                        )}

                        {elementForm.pricing_type === 'manual' && (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={elementForm.estimated_cost}
                            onChange={(e) => setElementForm({ ...elementForm, estimated_cost: e.target.value })}
                            placeholder="Estimated Cost (₹)"
                            className="mt-3 w-full rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a9df]"
                          />
                        )}

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={elementForm.actual_cost}
                          onChange={(e) => setElementForm({ ...elementForm, actual_cost: e.target.value })}
                          placeholder="Actual Cost (₹) — fill after final supplier price"
                          className="mt-3 w-full rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a9df]"
                        />

                        <div className="mt-3 rounded-lg border border-[#eadff2] bg-white px-3 py-3">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                            <div>
                              <p className="text-xs text-[#8B8194]">Cost Difference</p>
                              <p className="font-semibold text-[#3F3748] mt-1">
                                {formatElementVariance(
                                  getElementEstimatedCost(elementForm),
                                  elementForm.actual_cost
                                )}
                              </p>
                            </div>
                            <div className="text-xs text-[#8B8194] sm:text-right">
                              <p>
                                Estimate: {formatElementCurrency(getElementEstimatedCost(elementForm))}
                              </p>
                              <p className="mt-1">
                                Actual: {formatElementCurrency(elementForm.actual_cost)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SUPPLIER */}
                      <div className="md:col-span-2 rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4">
                        <p className="text-sm font-medium text-[#3F3748]">Supplier / Source</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          <div className="space-y-1">
                            <input
                              list="wedora-supplier-options"
                              value={elementForm.supplier}
                              onChange={(e) => {
                                const supplier = e.target.value;
                                const knownContact = supplierContactMap.get(supplier) || '';
                                setElementForm({
                                  ...elementForm,
                                  supplier,
                                  ...(knownContact ? { supplier_contact: knownContact } : {}),
                                });
                              }}
                              placeholder="Supplier / Vendor name"
                              className="w-full rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a9df]"
                            />
                            <datalist id="wedora-supplier-options">
                              {elementSupplierOptions.map((supplier) => (
                                <option key={supplier} value={supplier} />
                              ))}
                            </datalist>
                            {elementSupplierOptions.length > 0 && (
                              <p className="text-xs text-[#8B8194]">
                                Start typing to reuse an existing supplier.
                              </p>
                            )}
                          </div>
                          <input
                            value={elementForm.supplier_contact}
                            onChange={(e) => setElementForm({ ...elementForm, supplier_contact: e.target.value })}
                            placeholder="Supplier contact / WhatsApp number"
                            inputMode="tel"
                            className="rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a9df]"
                          />
                        </div>
                      </div>

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

                {/* SEARCH + FILTERS */}
                <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                      value={elementSearch}
                      onChange={(e) => setElementSearch(e.target.value)}
                      placeholder="Search elements, supplier, notes..."
                      className="md:col-span-2 rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a9df]"
                    />

                    <select
                      value={elementFilterCategory}
                      onChange={(e) => setElementFilterCategory(e.target.value)}
                      className="rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none"
                    >
                      <option>All Categories</option>
                      {DECORATOR_ELEMENT_CATEGORIES.filter((item) => item !== 'Custom').map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                      {customElementCategories.map((category) => (
                        <option key={category.id}>{category.name}</option>
                      ))}
                    </select>

                    <select
                      value={elementFilterFunction}
                      onChange={(e) => setElementFilterFunction(e.target.value)}
                      className="rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none"
                    >
                      {['All Functions', 'Haldi', 'Mehendi', 'Sangeet', 'Wedding', 'Reception', 'Other'].map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>

                    <select
                      value={elementFilterStatus}
                      onChange={(e) => setElementFilterStatus(e.target.value)}
                      className="rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none"
                    >
                      <option>All Status</option>
                      <option value="planned">Planned</option>
                      <option value="quotation">Quotation</option>
                      <option value="ordered">Ordered</option>
                      <option value="received">Received</option>
                      <option value="installed">Installed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="ready">Ready</option>
                      <option value="completed">Completed</option>
                    </select>

                    <select
                      value={elementFilterPricing}
                      onChange={(e) => setElementFilterPricing(e.target.value)}
                      className="rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none"
                    >
                      <option>All Pricing</option>
                      <option>Per Sq Ft</option>
                      <option>Per Unit</option>
                      <option>Manual</option>
                    </select>

                    <select
                      value={elementFilterSupplier}
                      onChange={(e) => setElementFilterSupplier(e.target.value)}
                      className="rounded-lg border border-[#eadff2] bg-white px-3 py-2 text-sm outline-none"
                    >
                      <option>All Suppliers</option>
                      {elementSupplierOptions.map((supplier) => (
                        <option key={supplier}>{supplier}</option>
                      ))}
                    </select>

                    <div className="md:col-span-2 flex items-center justify-between gap-3">
                      <p className="text-xs text-[#8B8194]">
                        {hasActiveElementFilters
                          ? `${filteredElements.length} matching element${filteredElements.length === 1 ? '' : 's'}`
                          : `${elements.length} element${elements.length === 1 ? '' : 's'} total`}
                      </p>

                      {hasActiveElementFilters && (
                        <button
                          type="button"
                          onClick={clearElementFilters}
                          className="rounded-lg bg-[#f4eafa] px-3 py-2 text-sm text-[#8B6AA8] hover:bg-[#eadcf5]"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {supplierOverview.length > 0 && (
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-[#8B8194]">Supplier Management</p>
                        <h4 className="text-lg font-semibold text-[#3F3748] mt-1">Supplier Overview</h4>
                      </div>
                      <p className="text-sm text-[#8B8194]">
                        {supplierOverview.length} supplier{supplierOverview.length === 1 ? '' : 's'}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {supplierOverview.map((supplier) => (
                        <button
                          key={supplier.supplier}
                          type="button"
                          onClick={() => setElementFilterSupplier(supplier.supplier)}
                          className="text-left rounded-xl border border-[#eadff2] bg-white p-4 hover:bg-[#faf7ff] transition"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-[#3F3748] truncate">{supplier.supplier}</p>
                              <p className="text-xs text-[#8B8194] mt-1">
                                {supplier.elements} element{supplier.elements === 1 ? '' : 's'}
                              </p>
                            </div>
                            <span className="rounded-full bg-[#f4eafa] px-2.5 py-1 text-xs text-[#8B6AA8]">
                              View
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#6B6175]">
                            <p><span className="text-[#8B8194]">Ordered:</span> {supplier.ordered}</p>
                            <p><span className="text-[#8B8194]">Pending:</span> {supplier.pending}</p>
                            <p><span className="text-[#8B8194]">Estimated:</span> {formatElementCurrency(supplier.estimated)}</p>
                            <p><span className="text-[#8B8194]">Actual:</span> {formatElementCurrency(supplier.actual)}</p>
                          </div>

                          <p className="mt-3 text-xs text-[#8B8194]">
                            {formatElementVariance(supplier.estimated, supplier.actual)}
                          </p>

                          {supplier.contact && (
                            <div className="mt-3 flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <span className="text-xs text-[#8B8194]">{supplier.contact}</span>
                              <a
                                href={`tel:${String(supplier.contact).replace(/[^+\d]/g, '')}`}
                                className="rounded-lg bg-[#f4eafa] px-2.5 py-1 text-xs text-[#8B6AA8] hover:underline"
                              >
                                Call
                              </a>
                              <a
                                href={`https://wa.me/${String(supplier.contact).replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg bg-[#f4eafa] px-2.5 py-1 text-xs text-[#8B6AA8] hover:underline"
                              >
                                WhatsApp
                              </a>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}







                {procurementSummary.length > 0 && (
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="text-sm text-[#8B8194]">Sourcing & Materials</p>
                        <h4 className="text-lg font-semibold text-[#3F3748] mt-1">Sourcing & Materials</h4>
                        <p className="text-sm text-[#6B6175] mt-1">
                          Separate rental, purchase, inventory and client/vendor-provided requirements.
                        </p>
                      </div>
                      <div className="rounded-lg bg-white px-3 py-2 text-xs text-[#8B8194] border border-[#eadff2]">
                        {procurementSummary.length} material line{procurementSummary.length === 1 ? '' : 's'}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                      {[
                        ['Not Specified', 'unspecified'],
                        ['Rent', 'rent'],
                        ['Purchase', 'purchase'],
                        ['Own Inventory', 'own_inventory'],
                        ['Client Provided', 'client_provided'],
                        ['Vendor Included', 'vendor_included'],
                      ].map(([label, type]) => (
                        <div key={type} className="rounded-xl border border-[#eadff2] bg-white p-4">
                          <p className="text-xs text-[#8B8194]">{label}</p>
                          <p className="text-xl font-semibold text-[#3F3748] mt-1">
                            {elements.filter((item) => (item.sourcing_type || 'rent') === type).length}
                          </p>
                          <p className="text-xs text-[#8B8194] mt-1">material line{elements.filter((item) => (item.sourcing_type || 'rent') === type).length === 1 ? '' : 's'}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5">
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-[#3F3748]">Material Requirement</p>
                        <p className="text-xs text-[#8B8194] mt-0.5">Category-wise quantity and area required, regardless of sourcing method.</p>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-[#eadff2] bg-white">
                        <table className="w-full min-w-[950px] text-left">
                          <thead>
                            <tr className="border-b border-[#eadff2] bg-[#faf7ff] text-xs text-[#8B8194]">
                              <th className="px-4 py-3 font-medium">Category</th>
                              <th className="px-4 py-3 font-medium">Required Quantity</th>
                              <th className="px-4 py-3 font-medium">Area</th>
                              <th className="px-4 py-3 font-medium">Lines</th>
                              <th className="px-4 py-3 font-medium">Rent</th>
                              <th className="px-4 py-3 font-medium">Purchase</th>
                              <th className="px-4 py-3 font-medium">Estimated</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from(
                              procurementSummary.reduce((map, item) => {
                                const category = item.category || 'General';
                                const current = map.get(category) || {
                                  category, lines: 0, area: 0, estimated: 0, quantities: {},
                                  rent: 0, purchase: 0,
                                };
                                current.lines += 1;
                                current.area += Number(item.area_sqft) || 0;
                                current.estimated += Number(item.estimated) || 0;
                                current.rent += item.sourcing_type === 'rent' ? 1 : 0;
                                current.purchase += item.sourcing_type === 'purchase' ? 1 : 0;
                                const unit = item.unit || 'pcs';
                                current.quantities[unit] = (current.quantities[unit] || 0) + (Number(item.quantity) || 0);
                                map.set(category, current);
                                return map;
                              }, new Map())
                            ).sort((a,b) => b[1].estimated - a[1].estimated).map(([category,item]) => (
                              <tr key={category} className="border-b border-[#f0e8f5] last:border-b-0">
                                <td className="px-4 py-3 font-medium text-[#3F3748]">{item.category}</td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-1.5">
                                    {Object.entries(item.quantities).map(([unit, quantity]) => (
                                      <span key={unit} className="inline-flex items-center rounded-full bg-[#faf7ff] border border-[#eadff2] px-2.5 py-1 text-xs text-[#6B6175]">
                                        {quantity.toLocaleString('en-IN', { maximumFractionDigits: 2 })} {unit}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-[#6B6175]">
                                  {item.area > 0 ? `${item.area.toLocaleString('en-IN', { maximumFractionDigits: 2 })} sq ft` : '—'}
                                </td>
                                <td className="px-4 py-3 text-sm text-[#6B6175]">{item.lines}</td>
                                <td className="px-4 py-3 text-sm text-[#6B6175]">{item.rent}</td>
                                <td className="px-4 py-3 text-sm text-[#6B6175]">{item.purchase}</td>
                                <td className="px-4 py-3 text-sm font-medium text-[#3F3748]">{formatElementCurrency(item.estimated)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-[#3F3748]">Sourcing Planning</p>
                        <p className="text-xs text-[#8B8194] mt-0.5">Rental and purchase requirements are separated so rental vendors are not treated as purchases.</p>
                      </div>

                      <div className="space-y-3">
                        {['rent', 'purchase', 'unspecified'].map((type) => {
                          const items = procurementSummary.filter((item) => item.sourcing_type === type);
                          if (!items.length) return null;
                          const sectionTitle = {
                            rent: 'Rental Requirements',
                            purchase: 'Purchase Requirements',
                            unspecified: 'Sourcing Not Specified',
                          }[type];
                          return (
                            <div key={type} className="rounded-xl border border-[#eadff2] bg-white overflow-hidden">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 bg-[#faf7ff] border-b border-[#eadff2]">
                                <div>
                                  <p className="text-sm font-medium text-[#3F3748]">{sectionTitle}</p>
                                  <p className="text-xs text-[#8B8194]">{items.length} line{items.length === 1 ? '' : 's'} · grouped by supplier</p>
                                </div>
                                <p className="text-sm font-semibold text-[#3F3748]">
                                  {formatElementCurrency(items.reduce((sum,item) => sum + Number(item.estimated || 0), 0))}
                                </p>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full min-w-[900px] text-left">
                                  <thead>
                                    <tr className="border-b border-[#f0e8f5] text-xs text-[#8B8194]">
                                      <th className="px-4 py-3 font-medium">Item</th>
                                      <th className="px-4 py-3 font-medium">Category</th>
                                      <th className="px-4 py-3 font-medium">Qty</th>
                                      <th className="px-4 py-3 font-medium">Area</th>
                                      <th className="px-4 py-3 font-medium">Supplier / Source</th>
                                      <th className="px-4 py-3 font-medium">Status</th>
                                      <th className="px-4 py-3 font-medium">Estimated</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {items.map((item,index) => (
                                      <tr key={`${type}-${item.name}-${item.category}-${item.function}-${item.supplier}-${index}`} className="border-b border-[#f0e8f5] last:border-b-0">
                                        <td className="px-4 py-3">
                                          <p className="font-medium text-[#3F3748]">{item.name}</p>
                                          <p className="text-xs text-[#8B8194] mt-0.5">Unit: {item.unit}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[#6B6175]">{item.category}</td>
                                        <td className="px-4 py-3 text-sm text-[#3F3748]">{item.quantity.toLocaleString('en-IN', { maximumFractionDigits: 2 })} {item.unit}</td>
                                        <td className="px-4 py-3 text-sm text-[#6B6175]">{item.area_sqft > 0 ? `${item.area_sqft.toLocaleString('en-IN', { maximumFractionDigits: 2 })} sq ft` : '—'}</td>
                                        <td className="px-4 py-3 text-sm text-[#6B6175]">{item.supplier || 'Not assigned'}</td>
                                        <td className="px-4 py-3 text-sm text-[#6B6175]">{item.pending > 0 ? 'Pending' : 'Ordered'}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-[#3F3748]">{formatElementCurrency(item.estimated)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {elementsLoading ? (
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-8 text-center text-sm text-[#8B8194]">Loading elements...</div>
                ) : filteredElements.length > 0 ? (
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="text-sm text-[#8B8194]">Your Elements</p>
                        <h4 className="text-lg font-semibold text-[#3F3748] mt-1">Decor Requirements</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-[#8B8194]">{filteredElements.length} shown / {elements.length} total</p>
                        <button
                          type="button"
                          onClick={exportElementsCsv}
                          className="rounded-lg bg-[#f4eafa] px-3 py-1.5 text-sm text-[#8B6AA8] hover:bg-[#eadcf5]"
                        >
                          <Download className="inline w-3.5 h-3.5 mr-1" />
                          Export CSV
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {filteredElements.map((element) => (
                        <div key={element.id} className="rounded-xl border border-[#eadff2] bg-white p-4">
                          <div className="flex flex-col md:flex-row md:items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium text-[#3F3748]">{element.name}</p>
                                <span className="rounded-full bg-[#f4eafa] px-2.5 py-1 text-xs text-[#8B6AA8]">{element.category}</span>
                                <span className="rounded-full bg-[#faf7ff] border border-[#eadff2] px-2.5 py-1 text-xs text-[#8B8194]">{{
                                  rent: 'Rent',
                                  purchase: 'Purchase',
                                  own_inventory: 'Own Inventory',
                                  client_provided: 'Client Provided',
                                  vendor_included: 'Vendor Included',
                                }[element.sourcing_type || 'unspecified'] || 'Not Specified'}</span>
                                <span className="rounded-full bg-[#faf7ff] border border-[#eadff2] px-2.5 py-1 text-xs text-[#8B8194] capitalize">{String(element.status || 'planned').replace('_', ' ')}</span>
                              </div>

                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-[#6B6175]">
                                <p><span className="text-[#8B8194]">Quantity:</span> {element.quantity} {element.unit || 'pcs'}</p>
                                <p><span className="text-[#8B8194]">Size:</span> {element.dimensions ? `${element.dimensions} ${element.dimension_unit || 'ft'}` : 'Not specified'}</p>
                                <p><span className="text-[#8B8194]">Area:</span> {Number(element.area_sqft || 0) > 0 ? `${element.area_sqft} sq ft` : 'Not calculated'}</p>
                                <p><span className="text-[#8B8194]">Function:</span> {element.function || 'All Functions'}</p>
                                <p><span className="text-[#8B8194]">Sourcing:</span> {{
                                  rent: 'Rent',
                                  purchase: 'Purchase',
                                  own_inventory: 'Own Inventory',
                                  client_provided: 'Client Provided',
                                  vendor_included: 'Vendor Included',
                                }[element.sourcing_type || 'unspecified'] || 'Not Specified'}</p>
                                <p><span className="text-[#8B8194]">Estimated:</span> {formatElementCurrency(element.estimated_cost)}</p>
                                <p><span className="text-[#8B8194]">Actual:</span> {formatElementCurrency(element.actual_cost)}</p>
                                <p><span className="text-[#8B8194]">Difference:</span> {formatElementVariance(element.estimated_cost, element.actual_cost)}</p>
                                <p>
                                  <span className="text-[#8B8194]">Supplier:</span>{' '}
                                  {element.supplier || 'Not assigned'}
                                  {element.supplier_contact && (
                                    <>
                                      {' · '}
                                      <a
                                        href={`tel:${String(element.supplier_contact).replace(/[^+\d]/g, '')}`}
                                        className="text-[#8B6AA8] hover:underline"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        Call
                                      </a>
                                      {' · '}
                                      <a
                                        href={`https://wa.me/${String(element.supplier_contact).replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[#8B6AA8] hover:underline"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        WhatsApp
                                      </a>
                                    </>
                                  )}
                                </p>
                                <p><span className="text-[#8B8194]">Area / Location:</span> {element.area || 'Not specified'}</p>
                              </div>

                              {element.pricing_type === 'per_sqft' && Number(element.rate || 0) > 0 && (
                                <p className="mt-2 text-xs text-[#8B8194]">
                                  Rate: ₹{Number(element.rate).toLocaleString('en-IN')} / sq ft
                                </p>
                              )}

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
                    <p className="text-sm text-[#8B8194]">No matching wedding elements.</p>
                    <p className="text-sm text-[#6B6175] mt-1">Add a decor element or adjust your search and filters.</p>
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
