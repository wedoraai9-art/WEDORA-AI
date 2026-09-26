import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  MapPin,
  Instagram,
  Phone,
  Globe,
  Briefcase,
  Star,
  Users,
  X,
  SlidersHorizontal,
  Sparkles,
  ExternalLink,
  Heart,
  CheckCircle2,
} from 'lucide-react';

const vendorCategories = [
  'Wedding Planner',
  'Decorator',
  'Photographer',
  'Videographer',
  'Caterer',
  'Makeup Artist',
  'Mehndi Artist',
  'Florist',
  'DJ & Entertainment',
  'Sangeet Choreographer',
  'Invitation Designer',
  'Bridal Wear',
  'Groom Wear',
  'Jewellery',
  'Wedding Cake',
  'Transportation',
  'Tent & Event Rentals',
  'Furniture',
  'Lighting & Sound',
  'Pandit & Ceremony Services',
  'Photobooth',
  'Wedding Gifts & Favors',
  'Honeymoon & Travel',
  'Destination Wedding Services',
  'Venue',
];

const cities = [
  'All India',
  'Jaipur',
  'Delhi',
  'Mumbai',
  'Udaipur',
  'Jodhpur',
  'Goa',
  'Bengaluru',
  'Hyderabad',
  'Kolkata',
  'Chandigarh',
  'Ahmedabad',
  'Pune',
  'Lucknow',
  'Agra',
  'Indore',
  'Chennai',
  'Kochi',
  'Amritsar',
  'Dehradun',
  'Rishikesh',
  'Pushkar',
  'Ajmer',
  'Jaisalmer',
  'Bhopal',
  'Surat',
];

const sampleVendors = [
  {
    id: 'vendor-001',
    name: 'Royal Moments Weddings',
    category: 'Wedding Planner',
    city: 'Jaipur',
    state: 'Rajasthan',
    experience: '8+ Years',
    rating: 4.9,
    reviews: 126,
    phone: '+91 90000 00001',
    instagram: '@royalmomentsweddings',
    website: 'www.royalmomentsweddings.com',
    address: 'C-Scheme, Jaipur, Rajasthan',
    description:
      'Full-service wedding planning and destination wedding management for intimate and grand celebrations.',
    services: [
      'Wedding Planning',
      'Destination Weddings',
      'Wedding Coordination',
      'Guest Management',
    ],
    priceRange: '₹5L – ₹25L+',
    portfolio: [
      'Royal Palace Wedding',
      'Luxury Garden Wedding',
      'Destination Wedding',
    ],
    verified: true,
  },
  {
    id: 'vendor-002',
    name: 'Frame & Vows Studio',
    category: 'Photographer',
    city: 'Delhi',
    state: 'Delhi',
    experience: '7+ Years',
    rating: 4.8,
    reviews: 94,
    phone: '+91 90000 00002',
    instagram: '@frameandvows',
    website: 'www.frameandvows.com',
    address: 'South Delhi, New Delhi',
    description:
      'Candid wedding photography, cinematic films and pre-wedding stories with a contemporary visual style.',
    services: [
      'Candid Photography',
      'Cinematic Films',
      'Pre-Wedding',
      'Drone',
    ],
    priceRange: '₹1.5L – ₹6L',
    portfolio: [
      'Candid Wedding',
      'Luxury Wedding Film',
      'Pre-Wedding Shoot',
    ],
    verified: true,
  },
  {
    id: 'vendor-003',
    name: 'Bloom & Beyond Decor',
    category: 'Decorator',
    city: 'Udaipur',
    state: 'Rajasthan',
    experience: '10+ Years',
    rating: 4.9,
    reviews: 168,
    phone: '+91 90000 00003',
    instagram: '@bloomandbeyonddecor',
    website: 'www.bloomandbeyonddecor.com',
    address: 'Lake City, Udaipur, Rajasthan',
    description:
      'Wedding décor, floral installations, mandaps, stage design and immersive celebration environments.',
    services: [
      'Wedding Decor',
      'Floral Decor',
      'Mandap Design',
      'Stage Design',
    ],
    priceRange: '₹3L – ₹30L+',
    portfolio: [
      'Royal Mandap',
      'Floral Wedding',
      'Luxury Reception',
    ],
    verified: true,
  },
  {
    id: 'vendor-004',
    name: 'The Gourmet Table',
    category: 'Caterer',
    city: 'Mumbai',
    state: 'Maharashtra',
    experience: '12+ Years',
    rating: 4.7,
    reviews: 212,
    phone: '+91 90000 00004',
    instagram: '@thegourmettable',
    website: 'www.thegourmettable.com',
    address: 'Bandra, Mumbai, Maharashtra',
    description:
      'Premium wedding catering with Indian, international and curated live food experiences.',
    services: [
      'Wedding Catering',
      'Live Counters',
      'International Cuisine',
      'Dessert Stations',
    ],
    priceRange: '₹1,200 – ₹4,000 / plate',
    portfolio: [
      'Luxury Buffet',
      'Live Food Experience',
      'Royal Indian Menu',
    ],
    verified: true,
  },
  {
    id: 'vendor-005',
    name: 'Glow Bridal Studio',
    category: 'Makeup Artist',
    city: 'Delhi',
    state: 'Delhi',
    experience: '6+ Years',
    rating: 4.9,
    reviews: 87,
    phone: '+91 90000 00005',
    instagram: '@glowbridalstudio',
    website: 'www.glowbridalstudio.com',
    address: 'Greater Kailash, New Delhi',
    description:
      'Bridal makeup, hairstyling and complete wedding-day beauty services.',
    services: [
      'Bridal Makeup',
      'Hair Styling',
      'Engagement Makeup',
      'Family Makeup',
    ],
    priceRange: '₹25K – ₹1.5L',
    portfolio: [
      'Bridal Makeup',
      'Engagement Look',
      'Reception Look',
    ],
    verified: true,
  },
  {
    id: 'vendor-006',
    name: 'Celebration Beats',
    category: 'DJ & Entertainment',
    city: 'Goa',
    state: 'Goa',
    experience: '9+ Years',
    rating: 4.8,
    reviews: 73,
    phone: '+91 90000 00006',
    instagram: '@celebrationbeatsgoa',
    website: 'www.celebrationbeats.com',
    address: 'North Goa, Goa',
    description:
      'Wedding DJs, live entertainment, sound, lighting and celebration experiences.',
    services: [
      'DJ',
      'Live Music',
      'Sound',
      'Lighting',
    ],
    priceRange: '₹50K – ₹5L+',
    portfolio: [
      'Sangeet Night',
      'Beach Wedding',
      'Reception Party',
    ],
    verified: false,
  },
];

const WedoraVendorDiscovery = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [city, setCity] = useState('All India');
  const [category, setCategory] = useState('All Categories');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [shortlisted, setShortlisted] = useState([]);

  // Live India-wide vendor discovery. The Gemini API key stays on the
  // FastAPI/Render backend; it is never exposed in this React file.
  const VENDOR_SEARCH_API =
    'https://wedora-ai.onrender.com/api/vendors/search';

  const [searched, setSearched] = useState(false);
  const [liveVendors, setLiveVendors] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchSources, setSearchSources] = useState([]);

  // Understand natural-language vendor searches such as:
  // "photographer in Delhi", "luxury decorator near Udaipur",
  // "bridal makeup artist in Jaipur" or "caterer in Mumbai".
  const parsedSearch = useMemo(() => {
    const text = query.toLowerCase().trim();

    let parsedCity = city === 'All India' ? '' : city;
    let parsedCategory =
      category === 'All Categories' ? '' : category;

    const knownCities = [
      'Jaipur',
      'Delhi',
      'Mumbai',
      'Udaipur',
      'Jodhpur',
      'Goa',
      'Bengaluru',
      'Hyderabad',
      'Kolkata',
      'Chandigarh',
      'Ahmedabad',
      'Pune',
      'Lucknow',
      'Agra',
      'Indore',
      'Chennai',
      'Kochi',
      'Amritsar',
      'Dehradun',
      'Rishikesh',
      'Pushkar',
      'Ajmer',
      'Jaisalmer',
      'Bhopal',
      'Surat',
    ];

    if (!parsedCity) {
      const foundCity = knownCities.find((item) =>
        text.includes(item.toLowerCase())
      );

      if (foundCity) {
        parsedCity = foundCity;
      }
    }

    const categoryAliases = [
      {
        category: 'Wedding Planner',
        keywords: ['planner', 'planning', 'wedding planner', 'event planner', 'coordinator'],
      },
      {
        category: 'Decorator',
        keywords: ['decorator', 'decoration', 'decor', 'wedding decor', 'stage decor', 'mandap decor', 'floral decor'],
      },
      {
        category: 'Photographer',
        keywords: ['photographer', 'photography', 'candid', 'photo', 'pre-wedding photography'],
      },
      {
        category: 'Videographer',
        keywords: ['videographer', 'video', 'wedding film', 'wedding films', 'cinematic film'],
      },
      {
        category: 'Caterer',
        keywords: ['caterer', 'catering', 'food', 'wedding food', 'cuisine'],
      },
      {
        category: 'Makeup Artist',
        keywords: ['makeup', 'make up', 'makeup artist', 'bridal makeup', 'beauty artist', 'hair stylist'],
      },
      {
        category: 'Mehndi Artist',
        keywords: ['mehndi', 'henna'],
      },
      {
        category: 'Florist',
        keywords: ['florist', 'flowers', 'floral', 'flower decor'],
      },
      {
        category: 'DJ & Entertainment',
        keywords: ['dj', 'entertainment', 'live music', 'music', 'band', 'wedding entertainment'],
      },
      {
        category: 'Sangeet Choreographer',
        keywords: ['choreographer', 'choreography', 'sangeet choreographer', 'dance'],
      },
      {
        category: 'Invitation Designer',
        keywords: ['invitation', 'invitations', 'invitation designer', 'wedding cards', 'stationery'],
      },
      {
        category: 'Bridal Wear',
        keywords: ['bridal wear', 'bridal dress', 'bridal lehenga', 'bridal clothing', 'lehenga'],
      },
      {
        category: 'Groom Wear',
        keywords: ['groom wear', 'sherwani', 'groom outfit', 'groom clothing'],
      },
      {
        category: 'Jewellery',
        keywords: ['jewellery', 'jewelry', 'bridal jewellery', 'bridal jewelry'],
      },
      {
        category: 'Wedding Cake',
        keywords: ['wedding cake', 'cake', 'cakes'],
      },
      {
        category: 'Transportation',
        keywords: ['transportation', 'wedding car', 'wedding cars', 'car rental', 'guest transport'],
      },
      {
        category: 'Tent & Event Rentals',
        keywords: ['tent house', 'tent', 'event rental', 'rentals', 'event rentals'],
      },
      {
        category: 'Furniture',
        keywords: ['furniture', 'event furniture', 'wedding furniture'],
      },
      {
        category: 'Lighting & Sound',
        keywords: ['lighting', 'sound', 'sound system', 'event lighting'],
      },
      {
        category: 'Pandit & Ceremony Services',
        keywords: ['pandit', 'priest', 'ceremony', 'wedding priest'],
      },
      {
        category: 'Photobooth',
        keywords: ['photobooth', 'photo booth', 'photo booth rental'],
      },
      {
        category: 'Wedding Gifts & Favors',
        keywords: ['wedding gifts', 'wedding favors', 'favors', 'return gifts', 'gift hampers'],
      },
      {
        category: 'Honeymoon & Travel',
        keywords: ['honeymoon', 'travel', 'honeymoon planner', 'travel agency'],
      },
      {
        category: 'Destination Wedding Services',
        keywords: ['destination wedding', 'destination wedding planner', 'destination services'],
      },
      {
        category: 'Venue',
        keywords: ['venue', 'wedding venue', 'banquet hall', 'resort', 'palace', 'farmhouse'],
      },
    ];

    if (!parsedCategory) {
      const foundCategory = categoryAliases.find((item) =>
        item.keywords.some((keyword) => text.includes(keyword))
      );

      if (foundCategory) {
        parsedCategory = foundCategory.category;
      }
    }

    return {
      city: parsedCity,
      category: parsedCategory,
    };
  }, [query, city, category]);

  const normalizedLiveVendors = useMemo(() => {
    return liveVendors.map((vendor, index) => {
      const sourceUrl = vendor.source_url || vendor.website_url || vendor.website || '';
      const website = vendor.website || sourceUrl || '';
      const instagram = vendor.instagram || '';

      return {
        id: vendor.id || `live-vendor-${index}-${vendor.name || 'vendor'}`,
        name: vendor.name || 'Unnamed Vendor',
        category: vendor.category || vendor.role || parsedSearch.category || 'Wedding Vendor',
        city: vendor.city || '',
        state: vendor.state || '',
        experience: vendor.experience || vendor.years_experience || 'Not listed',
        rating: Number(vendor.rating) || 0,
        reviews: Number(vendor.reviews) || 0,
        phone: vendor.phone || vendor.contact_phone || '',
        instagram,
        website,
        websiteUrl: sourceUrl,
        address: vendor.address || vendor.location || '',
        description: vendor.description || 'Wedding service provider discovered through WEDORA live search.',
        services: Array.isArray(vendor.services)
          ? vendor.services
          : vendor.services
            ? String(vendor.services).split(',').map((item) => item.trim()).filter(Boolean)
            : [],
        priceRange: vendor.price_range || vendor.priceRange || vendor.price_label || 'Price on request',
        portfolio: Array.isArray(vendor.portfolio) ? vendor.portfolio : [],
        verified: Boolean(vendor.verified || vendor.wedora_verified),
        sourceName: vendor.source_name || vendor.source || '',
        sourceUrl,
        lastChecked: vendor.last_checked || vendor.lastChecked || '',
        publicListing: vendor.public_listing !== false,
      };
    });
  }, [liveVendors, parsedSearch.category]);

  const displayedVendors = useMemo(() => {
    if (searched && liveVendors.length > 0) {
      return normalizedLiveVendors;
    }

    const search = query.toLowerCase().trim();

    return sampleVendors.filter((vendor) => {
      const matchesCity =
        !parsedSearch.city ||
        vendor.city.toLowerCase() === parsedSearch.city.toLowerCase();

      const matchesCategory =
        !parsedSearch.category ||
        vendor.category.toLowerCase() ===
          parsedSearch.category.toLowerCase();

      const searchableText = `
        ${vendor.name}
        ${vendor.category}
        ${vendor.city}
        ${vendor.state}
        ${vendor.description}
        ${vendor.services.join(' ')}
      `.toLowerCase();

      const structuredSearchDetected =
        Boolean(parsedSearch.city) ||
        Boolean(parsedSearch.category);

      const matchesSearch =
        !search ||
        structuredSearchDetected ||
        searchableText.includes(search);

      return (
        matchesCity &&
        matchesCategory &&
        matchesSearch
      );
    });
  }, [
    searched,
    liveVendors,
    normalizedLiveVendors,
    query,
    parsedSearch,
  ]);

  const filteredVendors = displayedVendors;

  const handleSearch = async () => {
    setSearched(true);
    setSearchLoading(true);
    setSearchError('');
    setLiveVendors([]);
    setSearchSources([]);

    const payload = {
      query: query.trim(),
      location: parsedSearch.city || (city !== 'All India' ? city : null),
      category: parsedSearch.category || (category !== 'All Categories' ? category : null),
    };

    if (!payload.query && !payload.location && !payload.category) {
      setSearchLoading(false);
      setSearchError('Please enter a vendor, service or city to search.');
      return;
    }

    try {
      const response = await fetch(VENDOR_SEARCH_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || `Vendor search failed (${response.status})`
        );
      }

      setLiveVendors(Array.isArray(data.results) ? data.results : []);
      setSearchSources(Array.isArray(data.sources) ? data.sources : []);

      if (!Array.isArray(data.results) || data.results.length === 0) {
        setSearchError(
          'No live vendors matched this search. Try a broader city, category or service.'
        );
      }
    } catch (error) {
      console.error('WEDORA live vendor search failed:', error);
      setSearchError(
        error.message ||
          'Unable to search live vendor data right now. Please try again.'
      );
      setLiveVendors([]);
    } finally {
      setSearchLoading(false);

      window.setTimeout(() => {
        const results = document.getElementById('vendor-results');

        if (results) {
          results.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, 80);
    }
  };

  const toggleShortlist = (vendorId) => {
    setShortlisted((current) =>
      current.includes(vendorId)
        ? current.filter((id) => id !== vendorId)
        : [...current, vendorId]
    );
  };

  const clearFilters = () => {
    setQuery('');
    setCity('All India');
    setCategory('All Categories');
    setSearched(false);
    setLiveVendors([]);
    setSearchSources([]);
    setSearchError('');
  };

  return (
   <div className="wedora-vendor-page min-h-screen bg-gradient-to-b from-[#FBF9FF] via-[#FFFCFE] to-[#F8F6FF] text-[#2D2638]">

      {/* TRANSPARENT BACK CONTROL */}
      <div className="relative z-20 mx-auto max-w-7xl px-6 pt-[112px] md:pt-[120px]">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm text-[#756A82] transition-all duration-200 hover:bg-white/55 hover:text-[#30283A] active:scale-[0.97] active:translate-y-[1px]"
        >
          <ArrowLeft size={18} />
          Back to WEDORA
        </button>
      </div>

      {/* HERO */}
      <main>

        <section className="relative overflow-hidden px-6 pb-16 pt-5 md:pt-7">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-[-10%] top-0 h-72 w-72 rounded-full bg-[#DCCBFF]/20 blur-[100px]" />
            <div className="absolute right-[-8%] top-10 h-80 w-80 rounded-full bg-[#F7C6DA]/20 blur-[110px]" />
            <div className="absolute bottom-[-20%] left-[35%] h-72 w-72 rounded-full bg-[#CBE8F7]/15 blur-[110px]" />
          </div>

          <div className="mx-auto max-w-5xl text-center">

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#E8DFF5] bg-[#F6F0FF] px-4 py-2 text-xs tracking-[0.18em] text-[#8E829F]">
              <Sparkles size={14} />
              INDIA'S WEDDING VENDOR DISCOVERY
            </div>

            <h1 className="text-4xl font-light tracking-tight md:text-6xl">
              Find the right
              <br />
              <span className="font-normal italic text-[#9B7CF6]">
                wedding vendor.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#746A82] md:text-lg">
              Search wedding professionals across India by service,
              city and expertise — and explore their complete profile.
            </p>

            {/* SEARCH BOX */}
            <div className="mx-auto mt-10 max-w-5xl rounded-[28px] border border-[#E8DFF5] bg-white p-3 shadow-[0_20px_60px_rgba(70,55,40,0.08)]">

              <div className="flex flex-col gap-3 lg:flex-row">

                <div className="flex min-h-[64px] flex-1 items-center gap-3 rounded-2xl bg-[#FBF9FD] px-5">

                  <Search
                    size={21}
                    className="shrink-0 text-[#9B7CF6]"
                  />

                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                    placeholder="Search photographer, decorator, caterer..."
                    className="w-full bg-transparent text-[15px] outline-none placeholder:text-[#B0A5C0]"
                  />

                  {query && (
                    <button onClick={() => setQuery('')}>
                      <X
                        size={17}
                        className="text-[#A198AD]"
                      />
                    </button>
                  )}

                </div>

                <div className="flex min-h-[64px] items-center gap-3 rounded-2xl bg-[#FBF9FD] px-5 lg:w-[210px]">

                  <MapPin
                    size={18}
                    className="text-[#9B7CF6]"
                  />

                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-transparent text-sm outline-none"
                  >
                    {cities.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>

                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex min-h-[64px] items-center justify-center gap-2 rounded-2xl border border-[#E8DFF5] px-6 text-sm text-[#62586F]"
                >
                  <SlidersHorizontal size={17} />
                  Filters
                </button>

                <button
                  onClick={handleSearch}
                  className="flex min-h-[64px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#D8C8FF] via-[#E8D3F4] to-[#F7C5D9] px-8 text-sm font-medium text-[#30283A] shadow-[0_8px_24px_rgba(155,124,246,0.16)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(155,124,246,0.22)] active:scale-[0.97] active:translate-y-[1px]"
                >
                  <Search size={18} />
                  Search
                </button>

              </div>

              {/* FILTERS */}
              {showFilters && (
                <div className="mt-4 border-t border-[#EEE8F5] pt-4">

                  <div className="grid gap-3 md:grid-cols-2">

                    <div className="rounded-2xl border border-[#E9E2F1] bg-[#FCFAFE] p-4 text-left">

                      <label className="mb-2 block text-xs tracking-wide text-[#8E829F]">
                        VENDOR CATEGORY
                      </label>

                      <select
                        value={category}
                        onChange={(e) =>
                          setCategory(e.target.value)
                        }
                        className="w-full bg-transparent text-sm outline-none"
                      >
                        <option>All Categories</option>

                        {vendorCategories.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>

                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-[#E9E2F1] bg-[#FCFAFE] p-4">

                      <div>
                        <p className="text-xs tracking-wide text-[#8E829F]">
                          SEARCH RESULTS
                        </p>

                        <p className="mt-1 text-lg">
                          {filteredVendors.length} Vendors
                        </p>
                      </div>

                      <button
                        onClick={clearFilters}
                        className="text-xs text-[#C98EAE] hover:underline"
                      >
                        Clear filters
                      </button>

                    </div>

                  </div>

                </div>
              )}

            </div>

          </div>

        </section>

        {/* CATEGORY QUICK SEARCH */}
        <section className="border-y border-[#EEE8F4] bg-white px-6 py-12">

          <div className="mx-auto max-w-6xl">

            <div className="mb-6 text-center">
              <p className="text-xs tracking-[0.2em] text-[#9B7CF6]">
                EXPLORE VENDORS
              </p>

              <h2 className="mt-2 text-2xl font-light">
                What are you looking for?
              </h2>
            </div>

            <div className="flex flex-wrap justify-center gap-2">

              {vendorCategories.map((item) => {

                const active = category === item;

                return (
                  <button
                    key={item}
                    onClick={() =>
                      setCategory(active ? 'All Categories' : item)
                    }
                    className={`rounded-full border px-4 py-2.5 text-xs transition ${
                      active
                        ? 'border-[#9B7CF6] bg-[#F5ECFF] text-[#806b52]'
                        : 'border-[#E9E1F2] bg-[#FFFDFF] text-[#756A82] hover:border-[#D2C2EE]'
                    }`}
                  >
                    {item}
                  </button>
                );

              })}

            </div>

          </div>

        </section>

        {/* RESULTS */}
        <section
          id="vendor-results"
          className="scroll-mt-24 px-6 py-16"
        >

          <div className="mx-auto max-w-7xl">

            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">

              <div>

                <p className="text-xs tracking-[0.2em] text-[#9B7CF6]">
                  WEDORA VENDOR NETWORK
                </p>

                <h2 className="mt-2 text-3xl font-light">
                  {searchLoading
                    ? 'Searching India...'
                    : `${filteredVendors.length} vendors found`}
                </h2>

              </div>

              <div className="flex items-center gap-2 text-xs text-[#8B8198]">
                <Users size={15} />
                Vendors across India
              </div>

            </div>

            {searchLoading && (
              <div className="mb-6 rounded-2xl border border-[#E8DFF5] bg-white px-5 py-4 text-sm text-[#756A82]">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#9B7CF6]" />
                  WEDORA is searching live wedding vendors across India...
                </div>
              </div>
            )}

            {searchError && !searchLoading && (
              <div className="mb-6 rounded-2xl border border-[#F0DCE7] bg-[#FFF8FB] px-5 py-4 text-sm text-[#8C6074]">
                {searchError}
              </div>
            )}

            {searched && !searchLoading && searchSources.length > 0 && (
              <div className="mb-6 rounded-2xl border border-[#E8DFF5] bg-white px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs tracking-[0.14em] text-[#9B7CF6]">
                    LIVE WEB SOURCES
                  </p>
                  <p className="text-xs text-[#978D9F]">
                    {searchSources.length} source{searchSources.length === 1 ? '' : 's'} used
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {searchSources.slice(0, 8).map((source, index) => (
                    <a
                      key={`${source.url || source.title || 'source'}-${index}`}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-[#E9E1F2] bg-[#FCFAFE] px-3 py-1.5 text-xs text-[#756A82] transition hover:border-[#CDBCEB] hover:bg-[#F6F0FF]"
                    >
                      {source.title || source.name || 'Source'}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {filteredVendors.map((vendor) => (

                <article
                  key={vendor.id}
                  className="overflow-hidden rounded-[26px] border border-[#e4ddd5] bg-white shadow-[0_15px_45px_rgba(70,55,40,0.05)] transition hover:-translate-y-1"
                >

                  {/* PROFILE COVER */}
                  <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-[#F7EAF3] via-[#F6F0FF] to-[#EAF1FA]">

                    <div className="text-center">

                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/80 text-[#9B7CF6]">
                        <Briefcase size={26} />
                      </div>

                      <p className="mt-3 text-xs text-[#958AA2]">
                        Vendor Portfolio
                      </p>

                    </div>

                    <button
                      onClick={() =>
                        toggleShortlist(vendor.id)
                      }
                      className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm"
                    >
                      <Heart
                        size={18}
                        className={
                          shortlisted.includes(vendor.id)
                            ? 'fill-[#9B7CF6] text-[#9B7CF6]'
                            : 'text-[#786E85]'
                        }
                      />
                    </button>

                    {vendor.verified ? (
                      <div className="absolute bottom-4 left-4 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-[10px] text-[#718C82]">
                        <CheckCircle2 size={12} />
                        WEDORA Verified
                      </div>
                    ) : vendor.sourceName ? (
                      <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] text-[#81758F]">
                        Found via {vendor.sourceName}
                      </div>
                    ) : null}

                  </div>

                  {/* PROFILE */}
                  <div className="p-6">

                    <div className="flex items-start justify-between gap-3">

                      <div>

                        <h3 className="text-lg font-medium">
                          {vendor.name}
                        </h3>

                        <p className="mt-1 text-xs text-[#91869D]">
                          {vendor.category}
                        </p>

                      </div>

                      <div className="flex items-center gap-1 rounded-full bg-[#F7F1FF] px-2.5 py-1 text-xs text-[#806b52]">
                        <Star
                          size={12}
                          className="fill-[#9B7CF6]"
                        />
                        {vendor.rating}
                      </div>

                    </div>

                    <div className="mt-4 flex items-center gap-1.5 text-xs text-[#817971]">
                      <MapPin size={14} />
                      {vendor.city}, {vendor.state}
                    </div>

                    <p className="mt-4 line-clamp-2 text-sm leading-6 text-[#746A82]">
                      {vendor.description}
                    </p>

                    {vendor.sourceName && (
                      <p className="mt-3 text-[10px] text-[#9A90A4]">
                        Source: {vendor.sourceName}
                        {vendor.lastChecked ? ` · Checked ${vendor.lastChecked}` : ''}
                      </p>
                    )}

                    {/* QUICK INFO */}
                    <div className="mt-5 grid grid-cols-2 gap-3">

                      <div className="rounded-xl bg-[#FBF9FD] p-3">
                        <p className="text-[10px] tracking-wide text-[#978d84]">
                          EXPERIENCE
                        </p>
                        <p className="mt-1 text-sm">
                          {vendor.experience}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#FBF9FD] p-3">
                        <p className="text-[10px] tracking-wide text-[#978d84]">
                          REVIEWS
                        </p>
                        <p className="mt-1 text-sm">
                          {vendor.reviews}
                        </p>
                      </div>

                    </div>

                    {/* SOCIAL */}
                    <div className="mt-4 flex items-center gap-2">

                      {vendor.instagram ? (
                      <a
                        href={`https://instagram.com/${vendor.instagram.replace(
                          '@',
                          ''
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#DCD0F0] bg-white/80 py-2.5 text-xs font-medium text-[#665A78] shadow-[0_4px_14px_rgba(155,124,246,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#CBB8EE] hover:bg-gradient-to-r hover:from-[#F4EEFF] hover:to-[#FFF1F7] hover:text-[#3F354D] transition-transform duration-150 active:scale-[0.97] active:translate-y-[1px]"
                      >
                        <Instagram size={14} />
                        Instagram
                      </a>
                      ) : (
                        <div className="flex flex-1 items-center justify-center rounded-xl border border-[#E8E0F1] bg-[#FBF9FD] py-2.5 text-xs text-[#A198AD]">
                          Instagram not listed
                        </div>
                      )}

                      {vendor.phone ? (
                      <a
                        href={`tel:${vendor.phone}`}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCD0F0] bg-white/80 text-[#8D75D9] shadow-[0_4px_14px_rgba(155,124,246,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#CBB8EE] hover:bg-[#F4EEFF] hover:text-[#6F57C8]"
                      >
                        <Phone size={15} />
                      </a>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E8E0F1] bg-[#FBF9FD] text-[#A198AD]">
                          <Phone size={15} />
                        </div>
                      )}

                    </div>

                    {/* DETAILS */}
                    <button
                      onClick={() =>
                        setSelectedVendor(vendor)
                      }
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D8C8FF] via-[#E8D3F4] to-[#F7C5D9] py-3 text-xs font-semibold text-[#30283A] shadow-[0_7px_20px_rgba(155,124,246,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(155,124,246,0.22)] transition-transform duration-150 active:scale-[0.97] active:translate-y-[1px]"
                    >
                      View Full Profile
                      <ExternalLink size={14} />
                    </button>

                  </div>

                </article>

              ))}

            </div>

            {filteredVendors.length === 0 && (
              <div className="rounded-[28px] border border-[#e4ddd5] bg-white px-6 py-20 text-center">

                <Search
                  size={35}
                  className="mx-auto text-[#B8A9C9]"
                />

                <h3 className="mt-5 text-xl font-light">
                  No vendors found
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#817971]">
                  Try another vendor category, city or search term.
                </p>

              </div>
            )}

          </div>

        </section>

        {/* VENDOR CTA */}
        <section className="border-t border-[#E9E2F2] bg-white px-6 py-20">

          <div className="mx-auto max-w-5xl rounded-[30px] bg-[#F4EEFF] px-8 py-14 text-center">

            <Sparkles
              size={28}
              className="mx-auto text-[#9B7CF6]"
            />

            <h2 className="mt-5 text-3xl font-light">
              Are you a wedding vendor?
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#7C7188]">
              Create your WEDORA vendor profile and let couples discover
              your services, portfolio and contact information.
            </p>

            <button
              className="mt-7 rounded-full bg-gradient-to-r from-[#D8C8FF] via-[#E8D3F4] to-[#F7C5D9] px-7 py-3 text-sm font-semibold text-[#30283A] shadow-[0_8px_24px_rgba(155,124,246,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(155,124,246,0.22)] active:scale-[0.97] active:translate-y-[1px] transition-transform duration-150 active:scale-[0.97] active:translate-y-[1px]"
            >
              Join WEDORA Vendor Network
            </button>

          </div>

        </section>

      </main>

      {/* FULL PROFILE MODAL */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#292330]/50 px-5 py-8 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[30px] bg-white shadow-2xl">

            {/* COVER */}
            <div className="relative flex h-52 items-center justify-center bg-gradient-to-br from-[#F7EAF3] via-[#F6F0FF] to-[#EAF1FA]">

              <button
                onClick={() => setSelectedVendor(null)}
                className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/90"
              >
                <X size={18} />
              </button>

              <div className="text-center">

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#9B7CF6]">
                  <Briefcase size={32} />
                </div>

                <p className="mt-3 text-xs text-[#8E829F]">
                  {selectedVendor.category}
                </p>

              </div>

            </div>

            <div className="p-8">

              <div className="flex flex-col justify-between gap-4 md:flex-row">

                <div>

                  <div className="flex items-center gap-2">

                    <h2 className="text-2xl font-light">
                      {selectedVendor.name}
                    </h2>

                    {selectedVendor.verified && (
                      <CheckCircle2
                        size={18}
                        className="text-[#708C82]"
                      />
                    )}

                  </div>

                  <p className="mt-2 text-sm text-[#817971]">
                    {selectedVendor.category} · {selectedVendor.city},{' '}
                    {selectedVendor.state}
                  </p>

                </div>

                <div className="flex items-center gap-1 self-start rounded-full bg-[#F7F1FF] px-4 py-2 text-sm text-[#806b52]">
                  <Star
                    size={14}
                    className="fill-[#9B7CF6]"
                  />
                  {selectedVendor.rating} ·{' '}
                  {selectedVendor.reviews} reviews
                </div>

              </div>

              <p className="mt-6 text-sm leading-7 text-[#756A82]">
                {selectedVendor.description}
              </p>

              {/* PROFILE DETAILS */}
              <div className="mt-7 grid gap-3 md:grid-cols-2">

                <div className="rounded-2xl bg-[#FBF9FD] p-4">
                  <p className="text-[10px] tracking-wide text-[#978d84]">
                    EXPERIENCE
                  </p>
                  <p className="mt-2 text-sm">
                    {selectedVendor.experience}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FBF9FD] p-4">
                  <p className="text-[10px] tracking-wide text-[#978d84]">
                    PRICE RANGE
                  </p>
                  <p className="mt-2 text-sm">
                    {selectedVendor.priceRange}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FBF9FD] p-4">
                  <p className="text-[10px] tracking-wide text-[#978d84]">
                    ADDRESS
                  </p>
                  <p className="mt-2 text-sm">
                    {selectedVendor.address}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FBF9FD] p-4">
                  <p className="text-[10px] tracking-wide text-[#978d84]">
                    PHONE
                  </p>
                  <p className="mt-2 text-sm">
                    {selectedVendor.phone}
                  </p>
                </div>

              </div>

              {/* SERVICES */}
              <div className="mt-8">

                <h3 className="text-lg font-light">
                  Services
                </h3>

                <div className="mt-3 flex flex-wrap gap-2">

                  {selectedVendor.services.map((service) => (
                    <span
                      key={service}
                      className="rounded-full bg-[#F6F0FF] px-4 py-2 text-xs text-[#74628D]"
                    >
                      {service}
                    </span>
                  ))}

                </div>

              </div>

              {/* PORTFOLIO */}
              <div className="mt-8">

                <h3 className="text-lg font-light">
                  Portfolio
                </h3>

                <div className="mt-4 grid gap-3 md:grid-cols-3">

                  {selectedVendor.portfolio.map((item) => (
                    <div
                      key={item}
                      className="flex h-28 items-end rounded-2xl bg-gradient-to-br from-[#EEE8F4] to-[#E9E7F5] p-3"
                    >
                      <span className="text-xs text-[#62586F]">
                        {item}
                      </span>
                    </div>
                  ))}

                </div>

              </div>

              {/* CONTACT */}
              <div className="mt-8 grid gap-3 md:grid-cols-3">

                <a
                  href={`tel:${selectedVendor.phone}`}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D8C8FF] via-[#E8D3F4] to-[#F7C5D9] py-3 text-xs font-semibold text-[#30283A] shadow-[0_7px_20px_rgba(155,124,246,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(155,124,246,0.22)] transition-transform duration-150 active:scale-[0.97] active:translate-y-[1px]"
                >
                  <Phone size={14} />
                  Call Vendor
                </a>

                <a
                  href={`https://instagram.com/${selectedVendor.instagram.replace(
                    '@',
                    ''
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#DCD0F0] bg-white/80 py-3 text-xs font-medium text-[#665A78] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#CBB8EE] hover:bg-gradient-to-r hover:from-[#F4EEFF] hover:to-[#FFF1F7] hover:text-[#3F354D] transition-transform duration-150 active:scale-[0.97] active:translate-y-[1px]"
                >
                  <Instagram size={14} />
                  Instagram
                </a>

                {selectedVendor.website || selectedVendor.websiteUrl ? (
                <a
                  href={
                    selectedVendor.websiteUrl ||
                    (String(selectedVendor.website).startsWith('http')
                      ? selectedVendor.website
                      : `https://${selectedVendor.website}`)
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#DCD0F0] bg-white/80 py-3 text-xs font-medium text-[#665A78] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#CBB8EE] hover:bg-gradient-to-r hover:from-[#F4EEFF] hover:to-[#FFF1F7] hover:text-[#3F354D] transition-transform duration-150 active:scale-[0.97] active:translate-y-[1px]"
                >
                  <Globe size={14} />
                  Website
                </a>
                ) : (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-[#E8E0F1] bg-[#FBF9FD] py-3 text-xs text-[#A198AD]">
                    <Globe size={14} />
                    Website not listed
                  </div>
                )}

              </div>

              {selectedVendor.sourceName && (
                <p className="mt-5 text-center text-[11px] text-[#9A90A4]">
                  Public source: {selectedVendor.sourceName}
                  {selectedVendor.sourceUrl ? (
                    <>
                      {' · '}
                      <a
                        href={selectedVendor.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#806B9D] underline underline-offset-2"
                      >
                        View source
                      </a>
                    </>
                  ) : null}
                </p>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default WedoraVendorDiscovery;
