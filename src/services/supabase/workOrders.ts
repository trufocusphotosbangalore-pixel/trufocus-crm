import { supabase } from './client'
import { broadcastPaymentSync } from '@/hooks/useRealtimeSync'
import { pushEntityToCloud, pullTableFromCloud, isCloudConfigured, extractEntitiesFromCloudRows } from '@/services/cloudSyncService'
import { canUserPerformDelete } from '@/services/permissionService'
import { logAIPermissionAudit } from '@/services/aiPermissionService'
import { filterWorkOrdersList } from '@/utils/workOrderStatusEngine'
import { getOrCreatePortalForWorkOrder } from '@/services/customerPortalStore'
import { recordCustomerPayment } from '@/services/financeStore'
import type {
  WorkOrder, WorkOrderFilters, WorkOrderWizardData,
  PaymentStatus, ContractStatus, WorkOrderPaymentLedger,
} from '@/types/workOrders'
import type { ApiResponse, PaginatedResult, SortConfig } from '@/types/common'

const TABLE = 'work_orders'
const LOCAL_STORAGE_WO_KEY = 'trufocus_crm_work_orders_v1'

const INITIAL_FALLBACK_WORK_ORDERS: any[] = [
  {
    "id": "wo-1785920742092",
    "city": "Bengaluru",
    "email": null,
    "notes": null,
    "venue": "Prems house",
    "events": [
      {
        "id": "ev-1785920506510",
        "notes": "",
        "venue": "prems house",
        "services": [
          {
            "id": "srv-1785920556012-wbc6",
            "remarks": "",
            "end_time": "21:00",
            "quantity": 1,
            "service_id": "srv-1",
            "start_time": "17:00",
            "service_name": "Traditional Photography",
            "assigned_team": []
          },
          {
            "id": "srv-1785920621639-lktk",
            "remarks": "",
            "end_time": "21:00",
            "quantity": 1,
            "service_id": "srv-3",
            "start_time": "17:00",
            "service_name": "Traditional Videography",
            "assigned_team": []
          }
        ],
        "event_date": "2026-08-01",
        "event_time": "17:00",
        "event_type_id": "et-9",
        "event_type_name": "Birthday / Private Party",
        "google_map_link": ""
      }
    ],
    "mobile": "9972501008",
    "source": "referral",
    "status": "upcoming",
    "payment": {
      "ledger": [
        {
          "id": "pay-1785922118704-bjg3",
          "notes": "",
          "amount": 10000,
          "created_at": "2026-08-05T09:28:38.704Z",
          "received_by": "Studio Admin",
          "payment_date": "2026-08-05",
          "payment_mode": "upi",
          "work_order_id": "wo-1785920742092",
          "transaction_ref": "7062"
        }
      ],
      "gst_amount": 0,
      "net_amount": 10000,
      "gst_percent": 0,
      "balance_amount": 0,
      "package_amount": 10000,
      "payment_status": "fully_paid",
      "amount_received": 10000,
      "discount_amount": 0
    },
    "contract": {
      "title": "Event Photography Agreement (Corporate / Parties)",
      "status": "pending",
      "valid_until": "",
      "terms_content": "<h2>1. Scope of Work</h2>\n<p>The studio agrees to provide professional coverage as specified in the service agreement for the event duration.</p>\n\n<h2>2. Payment Terms</h2>\n<p>Payment must be settled in full within 7 business days following the conclusion of the event.</p>\n\n<h2>3. Delivery</h2>\n<p>Digital gallery files delivered within 10 business days.</p>",
      "agreement_date": "2026-08-05",
      "agreement_number": "AGR-742092",
      "studio_signature": "Trufocus Studio",
      "customer_signature": ""
    },
    "is_draft": false,
    "created_at": "2026-08-05T09:05:42.092Z",
    "created_by": "usr_cloud_lookup",
    "deleted_at": null,
    "enquiry_id": null,
    "event_type": "Birthday / Private Party",
    "updated_at": "2026-08-05T09:28:38.704Z",
    "booking_date": "2026-08-31",
    "contract_url": null,
    "deliverables": [
      {
        "name": "Edited Photos",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-1"
      },
      {
        "name": "Traditional Video",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-2"
      },
      {
        "name": "Cinematic Film",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-3"
      },
      {
        "name": "Instagram Reel",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-4"
      },
      {
        "name": "Highlight Film",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-5"
      },
      {
        "name": "Luxury Album",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-6"
      },
      {
        "name": "Mini Album",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-7"
      },
      {
        "name": "Photo Frame",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-8"
      },
      {
        "name": "Canvas Print",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-9"
      },
      {
        "name": "Pen Drive",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-10"
      },
      {
        "name": "Online Gallery",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-11"
      }
    ],
    "project_name": "Prems wedding aniversay",
    "customer_name": "Prem Actor",
    "payment_status": "fully_paid",
    "pinterest_link": null,
    "contract_status": "pending",
    "google_map_link": null,
    "whatsapp_number": null,
    "alternate_mobile": "9113582807",
    "progress_percent": 15,
    "work_order_number": "WO-2025-915",
    "album_delivery_date": null,
    "final_delivery_date": "2026-08-08",
    "contract_accepted_at": "2026-08-05",
    "special_instructions": null
  },
  {
    "id": "wo-1785913573322",
    "city": "Bangalore",
    "email": null,
    "notes": null,
    "venue": "Uttara Kannada Hall Nandini Layout",
    "events": [
      {
        "id": "ev-1785913493112",
        "notes": "",
        "venue": "Uttara Kannada Hall Nandini Layout",
        "services": [
          {
            "id": "srv-1785913510622-8kt6",
            "remarks": "",
            "end_time": "18:00",
            "quantity": 1,
            "service_id": "srv-1",
            "start_time": "09:00",
            "service_name": "Traditional Photography",
            "assigned_team": []
          },
          {
            "id": "srv-1785913516483-osfv",
            "remarks": "",
            "end_time": "18:00",
            "quantity": 1,
            "service_id": "srv-3",
            "start_time": "09:00",
            "service_name": "Traditional Videography",
            "assigned_team": []
          }
        ],
        "event_date": "2026-09-06",
        "event_time": "12:35",
        "event_type_id": "et-9",
        "event_type_name": "Birthday / Private Party",
        "google_map_link": ""
      }
    ],
    "mobile": "8971190638",
    "source": "facebook",
    "status": "upcoming",
    "payment": {
      "ledger": [
        {
          "id": "pay-1785913547499-p74e",
          "notes": "",
          "amount": 3000,
          "created_at": "2026-08-05T07:05:47.499Z",
          "received_by": "Studio Accounts",
          "payment_date": "2026-08-05",
          "payment_mode": "Cash",
          "transaction_ref": ""
        }
      ],
      "gst_amount": 0,
      "net_amount": 8000,
      "gst_percent": 0,
      "balance_amount": 5000,
      "package_amount": 8000,
      "payment_status": "partially_paid",
      "amount_received": 3000,
      "discount_amount": 0
    },
    "contract": {
      "title": "Event Photography Agreement (Corporate / Parties)",
      "status": "pending",
      "valid_until": "2026-09-30",
      "terms_content": "<h2>1. Scope of Work</h2>\n<p>The studio agrees to provide professional coverage as specified in the service agreement for the event duration.</p>\n\n<h2>2. Payment Terms</h2>\n<p>Payment must be settled in full within 7 business days following the conclusion of the event.</p>\n\n<h2>3. Delivery</h2>\n<p>Digital gallery files delivered within 10 business days.</p>",
      "agreement_date": "2026-08-05",
      "agreement_number": "AGR-573322",
      "studio_signature": "Trufocus Studio",
      "customer_signature": ""
    },
    "is_draft": false,
    "created_at": "2026-08-05T07:06:13.322Z",
    "created_by": "usr_cloud_lookup",
    "deleted_at": null,
    "enquiry_id": null,
    "event_type": "Birthday / Private Party",
    "updated_at": "2026-08-05T07:06:13.322Z",
    "booking_date": "2026-07-14",
    "contract_url": null,
    "deliverables": [
      {
        "name": "Edited Photos",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-1"
      },
      {
        "name": "Traditional Video",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-2"
      },
      {
        "name": "Cinematic Film",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-3"
      },
      {
        "name": "Instagram Reel",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-4"
      },
      {
        "name": "Highlight Film",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-5"
      },
      {
        "name": "Luxury Album",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-6"
      },
      {
        "name": "Mini Album",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-7"
      },
      {
        "name": "Photo Frame",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-8"
      },
      {
        "name": "Canvas Print",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-9"
      },
      {
        "name": "Pen Drive",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-10"
      },
      {
        "name": "Online Gallery",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-11"
      }
    ],
    "project_name": "Maternity Shoot",
    "customer_name": "Yogesh",
    "payment_status": "partially_paid",
    "pinterest_link": null,
    "contract_status": "pending",
    "google_map_link": null,
    "whatsapp_number": null,
    "alternate_mobile": null,
    "progress_percent": 15,
    "work_order_number": "WO-2025-245",
    "album_delivery_date": "2026-09-30",
    "final_delivery_date": "2026-09-30",
    "contract_accepted_at": "2026-08-05",
    "special_instructions": null
  },
  {
    "id": "wo-1785913403094",
    "city": "Bangalore",
    "email": null,
    "notes": null,
    "venue": "Gowdra Hatti kengri",
    "events": [
      {
        "id": "ev-1785913279416",
        "notes": "",
        "venue": "Gowdra Hatti kengri",
        "services": [
          {
            "id": "srv-1785913298850-vxzx",
            "remarks": "",
            "end_time": "14:00",
            "quantity": 1,
            "service_id": "srv-1",
            "start_time": "09:00",
            "service_name": "Traditional Photography",
            "assigned_team": []
          },
          {
            "id": "srv-1785913328994-ywng",
            "remarks": "",
            "end_time": "14:00",
            "quantity": 1,
            "service_id": "srv-3",
            "start_time": "09:00",
            "service_name": "Traditional Videography",
            "assigned_team": []
          }
        ],
        "event_date": "2026-06-19",
        "event_time": "09:00",
        "event_type_id": "et-9",
        "event_type_name": "Birthday / Private Party",
        "google_map_link": ""
      }
    ],
    "mobile": "9916662380",
    "source": "whatsapp",
    "status": "upcoming",
    "payment": {
      "ledger": [
        {
          "id": "pay-1785913385613-vdkt",
          "notes": "",
          "amount": 2000,
          "created_at": "2026-08-05T07:03:05.613Z",
          "received_by": "Studio Accounts",
          "payment_date": "2026-06-18",
          "payment_mode": "UPI",
          "transaction_ref": "2323"
        }
      ],
      "gst_amount": 0,
      "net_amount": 22000,
      "gst_percent": 0,
      "balance_amount": 20000,
      "package_amount": 22000,
      "payment_status": "partially_paid",
      "amount_received": 2000,
      "discount_amount": 0
    },
    "contract": {
      "title": "Event Photography Agreement (Corporate / Parties)",
      "status": "pending",
      "valid_until": "2026-08-01",
      "terms_content": "<h2>1. Scope of Work</h2>\n<p>The studio agrees to provide professional coverage as specified in the service agreement for the event duration.</p>\n\n<h2>2. Payment Terms</h2>\n<p>Payment must be settled in full within 7 business days following the conclusion of the event.</p>\n\n<h2>3. Delivery</h2>\n<p>Digital gallery files delivered within 10 business days.</p>",
      "agreement_date": "2026-08-05",
      "agreement_number": "AGR-403094",
      "studio_signature": "Trufocus Studio",
      "customer_signature": ""
    },
    "is_draft": false,
    "created_at": "2026-08-05T07:03:23.094Z",
    "created_by": "usr_cloud_lookup",
    "deleted_at": null,
    "enquiry_id": null,
    "event_type": "Birthday / Private Party",
    "updated_at": "2026-08-05T07:03:23.094Z",
    "booking_date": "2026-06-11",
    "contract_url": null,
    "deliverables": [
      {
        "name": "Edited Photos",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-1"
      },
      {
        "name": "Traditional Video",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-2"
      },
      {
        "name": "Cinematic Film",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-3"
      },
      {
        "name": "Instagram Reel",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-4"
      },
      {
        "name": "Highlight Film",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-5"
      },
      {
        "name": "Luxury Album",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-6"
      },
      {
        "name": "Mini Album",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-7"
      },
      {
        "name": "Photo Frame",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-8"
      },
      {
        "name": "Canvas Print",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-9"
      },
      {
        "name": "Pen Drive",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-10"
      },
      {
        "name": "Online Gallery",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-11"
      }
    ],
    "project_name": "Naming Ceremony of Hanvay",
    "customer_name": "Varun kumar",
    "payment_status": "partially_paid",
    "pinterest_link": null,
    "contract_status": "pending",
    "google_map_link": null,
    "whatsapp_number": null,
    "alternate_mobile": null,
    "progress_percent": 15,
    "work_order_number": "WO-2025-783",
    "album_delivery_date": "2026-08-01",
    "final_delivery_date": "2026-08-01",
    "contract_accepted_at": "2026-08-05",
    "special_instructions": null
  },
  {
    "id": "wo-1785913150507",
    "city": "Bangalore",
    "email": null,
    "notes": null,
    "venue": null,
    "events": [
      {
        "id": "ev-1785913046944",
        "notes": "",
        "venue": "SDP PALACE KATAMNALLIUR K R URAM",
        "services": [
          {
            "id": "srv-1785913075442-ozmc",
            "remarks": "",
            "end_time": "18:00",
            "quantity": 1,
            "service_id": "srv-1",
            "start_time": "06:00",
            "service_name": "Traditional Photography",
            "assigned_team": []
          }
        ],
        "event_date": "2026-10-19",
        "event_time": "06:00",
        "event_type_id": "et-1",
        "event_type_name": "Wedding",
        "google_map_link": ""
      }
    ],
    "mobile": "9740335589",
    "source": "instagram",
    "status": "upcoming",
    "payment": {
      "ledger": [
        {
          "id": "pay-1785913122137-2g9p",
          "notes": "",
          "amount": 10000,
          "created_at": "2026-08-05T06:58:42.137Z",
          "received_by": "Studio Accounts",
          "payment_date": "2026-06-15",
          "payment_mode": "UPI",
          "transaction_ref": "21323"
        }
      ],
      "gst_amount": 0,
      "net_amount": 110000,
      "gst_percent": 0,
      "balance_amount": 100000,
      "package_amount": 110000,
      "payment_status": "partially_paid",
      "amount_received": 10000,
      "discount_amount": 0
    },
    "contract": {
      "title": "Standard Wedding Photography & Videography Agreement",
      "status": "pending",
      "valid_until": "2026-08-31",
      "terms_content": "<h2>1. Booking & Retainer</h2>\n<p>A non-refundable retainer fee of <strong>25%</strong> is required upon signing this contract to secure the shoot date(s). The balance amount shall be paid as per the agreed payment schedule.</p>\n\n<h2>2. Coverage & Services</h2>\n<p>Trufocus Photography agrees to provide the photographic and videographic coverage detailed in the Work Order. Any extra hours or additional services requested on-site will be billed separately.</p>\n\n<h2>3. Deliverables & Timeline</h2>\n<ul>\n  <li><strong>Edited High-Resolution Photos:</strong> Delivered within 21 to 30 working days after selection.</li>\n  <li><strong>Cinematic Teaser & Highlight Video:</strong> Delivered within 45 working days post-event.</li>\n  <li><strong>Photobooks & Printed Media:</strong> Delivered within 30 days after client album proof approval.</li>\n</ul>\n\n<h2>4. Copyright & Usage Rights</h2>\n<p>Trufocus Photography retains copyright for all images and video footage. The client is granted a non-exclusive license for personal usage, printing, and social media sharing.</p>\n\n<h2>5. Cancellation & Rescheduling</h2>\n<p>In the event of cancellation by the client, retainer payments remain non-refundable. Rescheduling is subject to studio calendar availability.</p>",
      "agreement_date": "2026-08-05",
      "agreement_number": "AGR-150507",
      "studio_signature": "Trufocus Studio",
      "customer_signature": ""
    },
    "is_draft": false,
    "created_at": "2026-08-05T06:59:10.507Z",
    "created_by": "usr_cloud_lookup",
    "deleted_at": null,
    "enquiry_id": null,
    "event_type": "Wedding",
    "updated_at": "2026-08-05T06:59:10.507Z",
    "booking_date": "2026-07-14",
    "contract_url": null,
    "deliverables": [
      {
        "name": "Edited Photos",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-1"
      },
      {
        "name": "Traditional Video",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-2"
      },
      {
        "name": "Cinematic Film",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-3"
      },
      {
        "name": "Instagram Reel",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-4"
      },
      {
        "name": "Highlight Film",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-5"
      },
      {
        "name": "Luxury Album",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-6"
      },
      {
        "name": "Mini Album",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-7"
      },
      {
        "name": "Photo Frame",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-8"
      },
      {
        "name": "Canvas Print",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-9"
      },
      {
        "name": "Pen Drive",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-10"
      },
      {
        "name": "Online Gallery",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-11"
      }
    ],
    "project_name": "Sahana's Wedding",
    "customer_name": "Chandre Gowd",
    "payment_status": "partially_paid",
    "pinterest_link": null,
    "contract_status": "pending",
    "google_map_link": null,
    "whatsapp_number": null,
    "alternate_mobile": null,
    "progress_percent": 15,
    "work_order_number": "WO-2025-187",
    "album_delivery_date": "2026-10-31",
    "final_delivery_date": "2026-10-31",
    "contract_accepted_at": "2026-08-05",
    "special_instructions": null
  },
  {
    "id": "wo-1785912924529",
    "city": "Bangalore",
    "email": null,
    "notes": null,
    "venue": "Hilton Hotel",
    "events": [
      {
        "id": "ev-1785912820351",
        "notes": "",
        "venue": "Hilton Hotel",
        "services": [
          {
            "id": "srv-1785912859277-3c49",
            "remarks": "",
            "end_time": "22:00",
            "quantity": 1,
            "service_id": "srv-2",
            "start_time": "19:00",
            "service_name": "Candid Photography",
            "assigned_team": []
          }
        ],
        "event_date": "2026-07-11",
        "event_time": "19:00",
        "event_type_id": "et-8",
        "event_type_name": "Corporate Event",
        "google_map_link": ""
      }
    ],
    "mobile": "7353759095",
    "source": "referral",
    "status": "upcoming",
    "payment": {
      "ledger": [
        {
          "id": "pay-1785912906414-ap1w",
          "notes": "",
          "amount": 5000,
          "created_at": "2026-08-05T06:55:06.414Z",
          "received_by": "Studio Accounts",
          "payment_date": "2026-07-11",
          "payment_mode": "Cash",
          "transaction_ref": ""
        }
      ],
      "gst_amount": 0,
      "net_amount": 5000,
      "gst_percent": 0,
      "balance_amount": 0,
      "package_amount": 5000,
      "payment_status": "fully_paid",
      "amount_received": 5000,
      "discount_amount": 0
    },
    "contract": {
      "title": "Event Photography Agreement (Corporate / Parties)",
      "status": "pending",
      "valid_until": "2026-08-01",
      "terms_content": "<h2>1. Scope of Work</h2>\n<p>The studio agrees to provide professional coverage as specified in the service agreement for the event duration.</p>\n\n<h2>2. Payment Terms</h2>\n<p>Payment must be settled in full within 7 business days following the conclusion of the event.</p>\n\n<h2>3. Delivery</h2>\n<p>Digital gallery files delivered within 10 business days.</p>",
      "agreement_date": "2026-08-05",
      "agreement_number": "AGR-924529",
      "studio_signature": "Trufocus Studio",
      "customer_signature": ""
    },
    "is_draft": false,
    "created_at": "2026-08-05T06:55:24.529Z",
    "created_by": "usr_cloud_lookup",
    "deleted_at": null,
    "enquiry_id": null,
    "event_type": "Corporate Event",
    "updated_at": "2026-08-05T06:55:24.529Z",
    "booking_date": "2026-07-10",
    "contract_url": null,
    "deliverables": [
      {
        "name": "Edited Photos",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-1"
      },
      {
        "name": "Traditional Video",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-2"
      },
      {
        "name": "Cinematic Film",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-3"
      },
      {
        "name": "Instagram Reel",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-4"
      },
      {
        "name": "Highlight Film",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-5"
      },
      {
        "name": "Luxury Album",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-6"
      },
      {
        "name": "Mini Album",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-7"
      },
      {
        "name": "Photo Frame",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-8"
      },
      {
        "name": "Canvas Print",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-9"
      },
      {
        "name": "Pen Drive",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-10"
      },
      {
        "name": "Online Gallery",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-11"
      }
    ],
    "project_name": "Cocktail Party",
    "customer_name": "Nikita Hilton Hotel",
    "payment_status": "fully_paid",
    "pinterest_link": null,
    "contract_status": "pending",
    "google_map_link": null,
    "whatsapp_number": null,
    "alternate_mobile": null,
    "progress_percent": 15,
    "work_order_number": "WO-2025-168",
    "album_delivery_date": "2026-08-01",
    "final_delivery_date": "2026-08-01",
    "contract_accepted_at": "2026-08-05",
    "special_instructions": null
  },
  {
    "id": "wo-1785912719974",
    "city": "Bangalore",
    "email": null,
    "notes": null,
    "venue": "White Petals, Vijayangar",
    "events": [
      {
        "id": "ev-1785912581393",
        "notes": "",
        "venue": "White Petals, Vijayanagar",
        "services": [
          {
            "id": "srv-1785912624832-etsb",
            "remarks": "",
            "end_time": "14:00",
            "quantity": 1,
            "service_id": "srv-1",
            "start_time": "10:00",
            "service_name": "Traditional Photography",
            "assigned_team": [
              {
                "role_title": "Candid Photographer",
                "employee_id": "fl-1785768027743",
                "employee_name": "Chidananda"
              }
            ]
          },
          {
            "id": "srv-1785912645258-i5p4",
            "remarks": "",
            "end_time": "14:00",
            "quantity": 1,
            "service_id": "srv-2",
            "start_time": "10:00",
            "service_name": "Candid Photography",
            "assigned_team": [
              {
                "role_title": "Candid Videographer",
                "employee_id": "fl-1785767958032",
                "employee_name": "Murali"
              }
            ]
          }
        ],
        "event_date": "2026-07-26",
        "event_time": "09:00",
        "event_type_id": "et-9",
        "event_type_name": "Birthday / Private Party",
        "google_map_link": ""
      }
    ],
    "mobile": "9844507550",
    "source": "referral",
    "status": "upcoming",
    "payment": {
      "ledger": [],
      "gst_amount": 0,
      "net_amount": 25000,
      "gst_percent": 0,
      "balance_amount": 25000,
      "package_amount": 25000,
      "payment_status": "pending",
      "amount_received": 0,
      "discount_amount": 0
    },
    "contract": {
      "title": "Event Photography Agreement (Corporate / Parties)",
      "status": "pending",
      "valid_until": "2026-08-31",
      "terms_content": "<h2>1. Scope of Work</h2>\n<p>The studio agrees to provide professional coverage as specified in the service agreement for the event duration.</p>\n\n<h2>2. Payment Terms</h2>\n<p>Payment must be settled in full within 7 business days following the conclusion of the event.</p>\n\n<h2>3. Delivery</h2>\n<p>Digital gallery files delivered within 10 business days.</p>",
      "agreement_date": "2026-08-05",
      "agreement_number": "AGR-719974",
      "studio_signature": "Trufocus Studio",
      "customer_signature": ""
    },
    "is_draft": false,
    "created_at": "2026-08-05T06:51:59.974Z",
    "created_by": "usr_cloud_lookup",
    "deleted_at": null,
    "enquiry_id": null,
    "event_type": "Birthday / Private Party",
    "updated_at": "2026-08-05T06:51:59.974Z",
    "booking_date": "2026-07-11",
    "contract_url": null,
    "deliverables": [
      {
        "name": "Edited Photos",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-1"
      },
      {
        "name": "Traditional Video",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-2"
      },
      {
        "name": "Cinematic Film",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-3"
      },
      {
        "name": "Instagram Reel",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-4"
      },
      {
        "name": "Highlight Film",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-5"
      },
      {
        "name": "Luxury Album",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-6"
      },
      {
        "name": "Mini Album",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-7"
      },
      {
        "name": "Photo Frame",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-8"
      },
      {
        "name": "Canvas Print",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-9"
      },
      {
        "name": "Pen Drive",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-10"
      },
      {
        "name": "Online Gallery",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-11"
      }
    ],
    "project_name": "Mivanshi's Magical First Birthday",
    "customer_name": " Mr & Mrs Nagaraj",
    "payment_status": "pending",
    "pinterest_link": null,
    "contract_status": "pending",
    "google_map_link": null,
    "whatsapp_number": null,
    "alternate_mobile": null,
    "progress_percent": 15,
    "work_order_number": "WO-2025-444",
    "album_delivery_date": "2026-08-31",
    "final_delivery_date": "2026-08-31",
    "contract_accepted_at": "2026-08-05",
    "special_instructions": null
  },
  {
    "id": "wo-1785912419464",
    "city": "Bangalore",
    "email": null,
    "notes": null,
    "venue": null,
    "events": [
      {
        "id": "ev-1785912255295",
        "notes": "",
        "venue": "",
        "services": [
          {
            "id": "srv-1785912297442-v5tk",
            "remarks": "",
            "end_time": "21:00",
            "quantity": 1,
            "service_id": "srv-1",
            "start_time": "18:00",
            "service_name": "Traditional Photography",
            "assigned_team": []
          },
          {
            "id": "srv-1785912305065-g2wm",
            "remarks": "",
            "end_time": "21:00",
            "quantity": 1,
            "service_id": "srv-3",
            "start_time": "18:00",
            "service_name": "Traditional Videography",
            "assigned_team": []
          }
        ],
        "event_date": "2026-05-30",
        "event_time": "18:00",
        "event_type_id": "et-9",
        "event_type_name": "Birthday / Private Party",
        "google_map_link": ""
      }
    ],
    "mobile": "9535408514",
    "source": "whatsapp",
    "status": "upcoming",
    "payment": {
      "ledger": [
        {
          "id": "pay-1785912377374-uq4a",
          "notes": "",
          "amount": 10000,
          "created_at": "2026-08-05T06:46:17.374Z",
          "received_by": "Studio Accounts",
          "payment_date": "2026-05-29",
          "payment_mode": "UPI",
          "transaction_ref": "2323"
        },
        {
          "id": "pay-1785912398243-6x0z",
          "notes": "",
          "amount": 4000,
          "created_at": "2026-08-05T06:46:38.243Z",
          "received_by": "Studio Accounts",
          "payment_date": "2026-06-18",
          "payment_mode": "UPI",
          "transaction_ref": "2323"
        }
      ],
      "gst_amount": 0,
      "net_amount": 18000,
      "gst_percent": 0,
      "balance_amount": 4000,
      "package_amount": 18000,
      "payment_status": "partially_paid",
      "amount_received": 14000,
      "discount_amount": 0
    },
    "contract": {
      "title": "Event Photography Agreement (Corporate / Parties)",
      "status": "pending",
      "valid_until": "2026-08-31",
      "terms_content": "<h2>1. Scope of Work</h2>\n<p>The studio agrees to provide professional coverage as specified in the service agreement for the event duration.</p>\n\n<h2>2. Payment Terms</h2>\n<p>Payment must be settled in full within 7 business days following the conclusion of the event.</p>\n\n<h2>3. Delivery</h2>\n<p>Digital gallery files delivered within 10 business days.</p>",
      "agreement_date": "2026-08-05",
      "agreement_number": "AGR-419464",
      "studio_signature": "Trufocus Studio",
      "customer_signature": ""
    },
    "is_draft": false,
    "created_at": "2026-08-05T06:46:59.464Z",
    "created_by": "usr_cloud_lookup",
    "deleted_at": null,
    "enquiry_id": null,
    "event_type": "Birthday / Private Party",
    "updated_at": "2026-08-05T06:46:59.464Z",
    "booking_date": "2026-05-29",
    "contract_url": null,
    "deliverables": [
      {
        "name": "Edited Photos",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-1"
      },
      {
        "name": "Traditional Video",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-2"
      },
      {
        "name": "Cinematic Film",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-3"
      },
      {
        "name": "Instagram Reel",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-4"
      },
      {
        "name": "Highlight Film",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-5"
      },
      {
        "name": "Luxury Album",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-6"
      },
      {
        "name": "Mini Album",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-7"
      },
      {
        "name": "Photo Frame",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-8"
      },
      {
        "name": "Canvas Print",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-9"
      },
      {
        "name": "Pen Drive",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-10"
      },
      {
        "name": "Online Gallery",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-11"
      }
    ],
    "project_name": " Happy Birthday Zainab",
    "customer_name": "Maseeha",
    "payment_status": "partially_paid",
    "pinterest_link": null,
    "contract_status": "pending",
    "google_map_link": null,
    "whatsapp_number": null,
    "alternate_mobile": null,
    "progress_percent": 15,
    "work_order_number": "WO-2025-988",
    "album_delivery_date": "2026-08-15",
    "final_delivery_date": "2026-08-15",
    "contract_accepted_at": "2026-08-05",
    "special_instructions": null
  },
  {
    "id": "wo-1785912163251",
    "city": "Bangalore",
    "email": null,
    "notes": null,
    "venue": null,
    "events": [
      {
        "id": "ev-1785912031496",
        "notes": "",
        "venue": "",
        "services": [
          {
            "id": "srv-1785912065668-ezs0",
            "remarks": "",
            "end_time": "15:00",
            "quantity": 1,
            "service_id": "srv-1",
            "start_time": "08:00",
            "service_name": "Traditional Photography",
            "assigned_team": []
          },
          {
            "id": "srv-1785912074008-32el",
            "remarks": "",
            "end_time": "15:00",
            "quantity": 1,
            "service_id": "srv-3",
            "start_time": "08:00",
            "service_name": "Traditional Videography",
            "assigned_team": []
          }
        ],
        "event_date": "2026-08-23",
        "event_time": "08:00",
        "event_type_id": "et-1",
        "event_type_name": "Wedding",
        "google_map_link": ""
      }
    ],
    "mobile": "9739395810",
    "source": "whatsapp",
    "status": "upcoming",
    "payment": {
      "ledger": [
        {
          "id": "pay-1785912139924-n42q",
          "notes": "",
          "amount": 5000,
          "created_at": "2026-08-05T06:42:19.924Z",
          "received_by": "Studio Accounts",
          "payment_date": "2026-07-11",
          "payment_mode": "UPI",
          "transaction_ref": "2222"
        }
      ],
      "gst_amount": 0,
      "net_amount": 25000,
      "gst_percent": 0,
      "balance_amount": 20000,
      "package_amount": 25000,
      "payment_status": "partially_paid",
      "amount_received": 5000,
      "discount_amount": 0
    },
    "contract": {
      "title": "Standard Wedding Photography & Videography Agreement",
      "status": "pending",
      "valid_until": "2026-08-31",
      "terms_content": "<h2>1. Booking & Retainer</h2>\n<p>A non-refundable retainer fee of <strong>25%</strong> is required upon signing this contract to secure the shoot date(s). The balance amount shall be paid as per the agreed payment schedule.</p>\n\n<h2>2. Coverage & Services</h2>\n<p>Trufocus Photography agrees to provide the photographic and videographic coverage detailed in the Work Order. Any extra hours or additional services requested on-site will be billed separately.</p>\n\n<h2>3. Deliverables & Timeline</h2>\n<ul>\n  <li><strong>Edited High-Resolution Photos:</strong> Delivered within 21 to 30 working days after selection.</li>\n  <li><strong>Cinematic Teaser & Highlight Video:</strong> Delivered within 45 working days post-event.</li>\n  <li><strong>Photobooks & Printed Media:</strong> Delivered within 30 days after client album proof approval.</li>\n</ul>\n\n<h2>4. Copyright & Usage Rights</h2>\n<p>Trufocus Photography retains copyright for all images and video footage. The client is granted a non-exclusive license for personal usage, printing, and social media sharing.</p>\n\n<h2>5. Cancellation & Rescheduling</h2>\n<p>In the event of cancellation by the client, retainer payments remain non-refundable. Rescheduling is subject to studio calendar availability.</p>",
      "agreement_date": "2026-08-05",
      "agreement_number": "AGR-163251",
      "studio_signature": "Trufocus Studio",
      "customer_signature": ""
    },
    "is_draft": false,
    "created_at": "2026-08-05T06:42:43.251Z",
    "created_by": "usr_cloud_lookup",
    "deleted_at": null,
    "enquiry_id": null,
    "event_type": "Wedding",
    "updated_at": "2026-08-05T06:42:43.251Z",
    "booking_date": "2026-07-11",
    "contract_url": null,
    "deliverables": [
      {
        "name": "Edited Photos",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-1"
      },
      {
        "name": "Traditional Video",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-2"
      },
      {
        "name": "Cinematic Film",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-3"
      },
      {
        "name": "Instagram Reel",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-4"
      },
      {
        "name": "Highlight Film",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-5"
      },
      {
        "name": "Luxury Album",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-6"
      },
      {
        "name": "Mini Album",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-7"
      },
      {
        "name": "Photo Frame",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-8"
      },
      {
        "name": "Canvas Print",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-9"
      },
      {
        "name": "Pen Drive",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-10"
      },
      {
        "name": "Online Gallery",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-11"
      }
    ],
    "project_name": "Madhuri's Wedding",
    "customer_name": "Madhuri",
    "payment_status": "partially_paid",
    "pinterest_link": null,
    "contract_status": "pending",
    "google_map_link": null,
    "whatsapp_number": null,
    "alternate_mobile": null,
    "progress_percent": 15,
    "work_order_number": "WO-2025-976",
    "album_delivery_date": "2026-08-31",
    "final_delivery_date": "2026-08-31",
    "contract_accepted_at": "2026-08-05",
    "special_instructions": null
  },
  {
    "id": "wo-1785911946785",
    "city": "Bangalore",
    "email": null,
    "notes": null,
    "venue": null,
    "events": [
      {
        "id": "ev-1785911706464",
        "notes": "",
        "venue": "",
        "services": [
          {
            "id": "srv-1785911851841-v8kc",
            "remarks": "",
            "end_time": "12:00",
            "quantity": 1,
            "service_id": "srv-1",
            "start_time": "09:00",
            "service_name": "Traditional Photography",
            "assigned_team": []
          }
        ],
        "event_date": "2026-07-25",
        "event_time": "10:00",
        "event_type_id": "et-1",
        "event_type_name": "Wedding",
        "google_map_link": ""
      }
    ],
    "mobile": "9391556810",
    "source": null,
    "status": "upcoming",
    "payment": {
      "ledger": [
        {
          "id": "pay-1785911901577-6cz5",
          "notes": "",
          "amount": 2000,
          "created_at": "2026-08-05T06:38:21.577Z",
          "received_by": "Studio Accounts",
          "payment_date": "2026-07-25",
          "payment_mode": "UPI",
          "transaction_ref": "\tt2607251618563010837450"
        },
        {
          "id": "pay-1785911922962-txeo",
          "notes": "",
          "amount": 2000,
          "created_at": "2026-08-05T06:38:42.962Z",
          "received_by": "Studio Accounts",
          "payment_date": "2026-07-27",
          "payment_mode": "UPI",
          "transaction_ref": "t2607271354245752293454"
        }
      ],
      "gst_amount": 0,
      "net_amount": 4000,
      "gst_percent": 0,
      "balance_amount": 0,
      "package_amount": 4000,
      "payment_status": "fully_paid",
      "amount_received": 4000,
      "discount_amount": 0
    },
    "contract": {
      "title": "Event Photography Agreement (Corporate / Parties)",
      "status": "pending",
      "valid_until": "2026-08-01",
      "terms_content": "<h2>1. Scope of Work</h2>\n<p>The studio agrees to provide professional coverage as specified in the service agreement for the event duration.</p>\n\n<h2>2. Payment Terms</h2>\n<p>Payment must be settled in full within 7 business days following the conclusion of the event.</p>\n\n<h2>3. Delivery</h2>\n<p>Digital gallery files delivered within 10 business days.</p>",
      "agreement_date": "2026-08-05",
      "agreement_number": "AGR-946785",
      "studio_signature": "Trufocus Studio",
      "customer_signature": ""
    },
    "is_draft": false,
    "created_at": "2026-08-05T06:39:06.785Z",
    "created_by": "usr_cloud_lookup",
    "deleted_at": null,
    "enquiry_id": null,
    "event_type": "Birthday / Private Party",
    "updated_at": "2026-08-05T06:39:06.785Z",
    "booking_date": "2026-07-25",
    "contract_url": null,
    "deliverables": [
      {
        "name": "Edited Photos",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-1"
      },
      {
        "name": "Traditional Video",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-2"
      },
      {
        "name": "Cinematic Film",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-3"
      },
      {
        "name": "Instagram Reel",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-4"
      },
      {
        "name": "Highlight Film",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-5"
      },
      {
        "name": "Luxury Album",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-6"
      },
      {
        "name": "Mini Album",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-7"
      },
      {
        "name": "Photo Frame",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-8"
      },
      {
        "name": "Canvas Print",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-9"
      },
      {
        "name": "Pen Drive",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-10"
      },
      {
        "name": "Online Gallery",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-11"
      }
    ],
    "project_name": "Kiran's wedding",
    "customer_name": "Kiran",
    "payment_status": "fully_paid",
    "pinterest_link": null,
    "contract_status": "pending",
    "google_map_link": null,
    "whatsapp_number": null,
    "alternate_mobile": null,
    "progress_percent": 15,
    "work_order_number": "WO-2025-806",
    "album_delivery_date": "2026-08-01",
    "final_delivery_date": "2026-08-01",
    "contract_accepted_at": "2026-08-05",
    "special_instructions": null
  },
  {
    "id": "wo-1785911544016",
    "city": "Bangalore",
    "email": null,
    "notes": null,
    "venue": "Hotel Hilton",
    "events": [
      {
        "id": "ev-1785911079681",
        "notes": "",
        "venue": "Hotel Hilton",
        "services": [
          {
            "id": "srv-1785911143857-pflg",
            "remarks": "",
            "end_time": "22:00",
            "quantity": 1,
            "service_id": "srv-3",
            "start_time": "18:00",
            "service_name": "Traditional Videography",
            "assigned_team": []
          }
        ],
        "event_date": "2026-07-21",
        "event_time": "18:00",
        "event_type_id": "et-8",
        "event_type_name": "Corporate Event",
        "google_map_link": ""
      }
    ],
    "mobile": "6366357989",
    "source": "phone_call",
    "status": "upcoming",
    "payment": {
      "ledger": [],
      "gst_amount": 1620,
      "net_amount": 10620,
      "gst_percent": 18,
      "balance_amount": 10620,
      "package_amount": 9000,
      "payment_status": "pending",
      "amount_received": 0,
      "discount_amount": 0
    },
    "contract": {
      "title": "Event Photography Agreement (Corporate / Parties)",
      "status": "pending",
      "valid_until": "2026-08-10",
      "terms_content": "<h2>1. Scope of Work</h2>\n<p>The studio agrees to provide professional coverage as specified in the service agreement for the event duration.</p>\n\n<h2>2. Payment Terms</h2>\n<p>Payment must be settled in full within 7 business days following the conclusion of the event.</p>\n\n<h2>3. Delivery</h2>\n<p>Digital gallery files delivered within 10 business days.</p>",
      "agreement_date": "2026-08-05",
      "agreement_number": "AGR-544016",
      "studio_signature": "Trufocus Studio",
      "customer_signature": ""
    },
    "is_draft": false,
    "created_at": "2026-08-05T06:32:24.016Z",
    "created_by": "usr_cloud_lookup",
    "deleted_at": null,
    "enquiry_id": null,
    "event_type": "Corporate Event",
    "updated_at": "2026-08-05T06:32:24.016Z",
    "booking_date": "2026-07-21",
    "contract_url": null,
    "deliverables": [
      {
        "name": "Edited Photos",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-1"
      },
      {
        "name": "Traditional Video",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-2"
      },
      {
        "name": "Cinematic Film",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-3"
      },
      {
        "name": "Instagram Reel",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-4"
      },
      {
        "name": "Highlight Film",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-5"
      },
      {
        "name": "Luxury Album",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-6"
      },
      {
        "name": "Mini Album",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-7"
      },
      {
        "name": "Photo Frame",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-8"
      },
      {
        "name": "Canvas Print",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-9"
      },
      {
        "name": "Pen Drive",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-10"
      },
      {
        "name": "Online Gallery",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-11"
      }
    ],
    "project_name": "Cocktail Party",
    "customer_name": "DKMS Asia Pvt Ltd (Drithi)",
    "payment_status": "pending",
    "pinterest_link": null,
    "contract_status": "pending",
    "google_map_link": null,
    "whatsapp_number": null,
    "alternate_mobile": null,
    "progress_percent": 15,
    "work_order_number": "WO-2025-159",
    "album_delivery_date": "2026-07-31",
    "final_delivery_date": "2026-07-31",
    "contract_accepted_at": "2026-08-05",
    "special_instructions": null
  },
  {
    "id": "wo-1785910976632",
    "city": "Bangalore",
    "email": null,
    "notes": null,
    "venue": null,
    "events": [
      {
        "id": "ev-1785910684200",
        "notes": "",
        "venue": "",
        "services": [
          {
            "id": "srv-1785910718945-0vgy",
            "remarks": "",
            "end_time": "14:00",
            "quantity": 1,
            "service_id": "srv-1",
            "start_time": "09:00",
            "service_name": "Traditional Photography",
            "assigned_team": []
          }
        ],
        "event_date": "2026-06-17",
        "event_time": "09:00",
        "event_type_id": "et-9",
        "event_type_name": "Birthday / Private Party",
        "google_map_link": ""
      }
    ],
    "mobile": "8095630589",
    "source": null,
    "status": "upcoming",
    "payment": {
      "ledger": [
        {
          "id": "pay-1785910833762-lsms",
          "notes": "",
          "amount": 5000,
          "created_at": "2026-08-05T06:20:33.762Z",
          "received_by": "Studio Accounts",
          "payment_date": "2026-07-23",
          "payment_mode": "UPI",
          "transaction_ref": "5827931911"
        },
        {
          "id": "pay-1785910950888-etlg",
          "notes": "",
          "amount": 7000,
          "created_at": "2026-08-05T06:22:30.888Z",
          "received_by": "Studio Accounts",
          "payment_date": "2026-07-27",
          "payment_mode": "UPI",
          "transaction_ref": "5827931911"
        }
      ],
      "gst_amount": 0,
      "net_amount": 12000,
      "gst_percent": 0,
      "balance_amount": 0,
      "package_amount": 12000,
      "payment_status": "fully_paid",
      "amount_received": 12000,
      "discount_amount": 0
    },
    "contract": {
      "title": "Event Photography Agreement (Corporate / Parties)",
      "status": "pending",
      "valid_until": "2026-08-31",
      "terms_content": "<h2>1. Scope of Work</h2>\n<p>The studio agrees to provide professional coverage as specified in the service agreement for the event duration.</p>\n\n<h2>2. Payment Terms</h2>\n<p>Payment must be settled in full within 7 business days following the conclusion of the event.</p>\n\n<h2>3. Delivery</h2>\n<p>Digital gallery files delivered within 10 business days.</p>",
      "agreement_date": "2026-08-05",
      "agreement_number": "AGR-976633",
      "studio_signature": "Trufocus Studio",
      "customer_signature": ""
    },
    "is_draft": false,
    "created_at": "2026-08-05T06:22:56.633Z",
    "created_by": "usr_cloud_lookup",
    "deleted_at": null,
    "enquiry_id": null,
    "event_type": "Birthday / Private Party",
    "updated_at": "2026-08-05T06:22:56.633Z",
    "booking_date": "2026-06-23",
    "contract_url": null,
    "deliverables": [
      {
        "name": "Edited Photos",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-1"
      },
      {
        "name": "Traditional Video",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-2"
      },
      {
        "name": "Cinematic Film",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-3"
      },
      {
        "name": "Instagram Reel",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-4"
      },
      {
        "name": "Highlight Film",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-5"
      },
      {
        "name": "Luxury Album",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-6"
      },
      {
        "name": "Mini Album",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-7"
      },
      {
        "name": "Photo Frame",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-8"
      },
      {
        "name": "Canvas Print",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-9"
      },
      {
        "name": "Pen Drive",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-10"
      },
      {
        "name": "Online Gallery",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-11"
      }
    ],
    "project_name": "Ashwini's Puberty Function",
    "customer_name": "Ashwini Manjunath",
    "payment_status": "fully_paid",
    "pinterest_link": null,
    "contract_status": "pending",
    "google_map_link": null,
    "whatsapp_number": null,
    "alternate_mobile": null,
    "progress_percent": 15,
    "work_order_number": "WO-2025-589",
    "album_delivery_date": "2026-08-01",
    "final_delivery_date": "2026-08-01",
    "contract_accepted_at": "2026-08-05",
    "special_instructions": null
  },
  {
    "id": "wo-1785910542100",
    "city": "Bangalore",
    "email": null,
    "notes": null,
    "venue": null,
    "events": [
      {
        "id": "ev-1785910380784",
        "notes": "",
        "venue": "",
        "services": [
          {
            "id": "srv-1785910410946-vf90",
            "remarks": "",
            "end_time": "22:00",
            "quantity": 1,
            "service_id": "srv-1",
            "start_time": "17:00",
            "service_name": "Traditional Photography",
            "assigned_team": []
          },
          {
            "id": "srv-1785910453796-eo97",
            "remarks": "",
            "end_time": "22:00",
            "quantity": 1,
            "service_id": "srv-3",
            "start_time": "17:00",
            "service_name": "Traditional Videography",
            "assigned_team": []
          }
        ],
        "event_date": "2026-06-11",
        "event_time": "17:00",
        "event_type_id": "et-9",
        "event_type_name": "Birthday / Private Party",
        "google_map_link": ""
      }
    ],
    "mobile": "7411921613",
    "source": "instagram",
    "status": "upcoming",
    "payment": {
      "ledger": [
        {
          "id": "pay-1785910516219-ttw4",
          "notes": "",
          "amount": 5000,
          "created_at": "2026-08-05T06:15:16.219Z",
          "received_by": "Studio Accounts",
          "payment_date": "2026-06-30",
          "payment_mode": "UPI",
          "transaction_ref": "123772807069"
        }
      ],
      "gst_amount": 0,
      "net_amount": 23000,
      "gst_percent": 0,
      "balance_amount": 18000,
      "package_amount": 23000,
      "payment_status": "partially_paid",
      "amount_received": 5000,
      "discount_amount": 0
    },
    "contract": {
      "title": "Event Photography Agreement (Corporate / Parties)",
      "status": "pending",
      "valid_until": "2026-08-31",
      "terms_content": "<h2>1. Scope of Work</h2>\n<p>The studio agrees to provide professional coverage as specified in the service agreement for the event duration.</p>\n\n<h2>2. Payment Terms</h2>\n<p>Payment must be settled in full within 7 business days following the conclusion of the event.</p>\n\n<h2>3. Delivery</h2>\n<p>Digital gallery files delivered within 10 business days.</p>",
      "agreement_date": "2026-08-05",
      "agreement_number": "AGR-542100",
      "studio_signature": "Trufocus Studio",
      "customer_signature": ""
    },
    "is_draft": false,
    "created_at": "2026-08-05T06:15:42.100Z",
    "created_by": "usr_cloud_lookup",
    "deleted_at": null,
    "enquiry_id": null,
    "event_type": "Birthday / Private Party",
    "updated_at": "2026-08-05T06:15:42.100Z",
    "booking_date": "2026-06-02",
    "contract_url": null,
    "deliverables": [
      {
        "name": "Edited Photos",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-1"
      },
      {
        "name": "Traditional Video",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-2"
      },
      {
        "name": "Cinematic Film",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-3"
      },
      {
        "name": "Instagram Reel",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-4"
      },
      {
        "name": "Highlight Film",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-5"
      },
      {
        "name": "Luxury Album",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-6"
      },
      {
        "name": "Mini Album",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-7"
      },
      {
        "name": "Photo Frame",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-8"
      },
      {
        "name": "Canvas Print",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-9"
      },
      {
        "name": "Pen Drive",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-10"
      },
      {
        "name": "Online Gallery",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-11"
      }
    ],
    "project_name": "Sherin Joanna 1st Year Birthday Party",
    "customer_name": "Anthony",
    "payment_status": "partially_paid",
    "pinterest_link": null,
    "contract_status": "pending",
    "google_map_link": null,
    "whatsapp_number": null,
    "alternate_mobile": null,
    "progress_percent": 15,
    "work_order_number": "WO-2025-940",
    "album_delivery_date": "2026-08-30",
    "final_delivery_date": "2026-08-30",
    "contract_accepted_at": "2026-08-05",
    "special_instructions": null
  },
  {
    "id": "wo-1785853783806",
    "city": "Bangalore",
    "email": null,
    "notes": null,
    "venue": null,
    "events": [
      {
        "id": "ev-1785853148027",
        "notes": "",
        "venue": "Bride's Home",
        "services": [
          {
            "id": "srv-1785853215968-skt7",
            "remarks": "",
            "end_time": "14:00",
            "quantity": 1,
            "service_id": "srv-1",
            "start_time": "08:00",
            "service_name": "Traditional Photography",
            "assigned_team": [
              {
                "role_title": "Traditional Photographer",
                "employee_id": "emp-1785767911514",
                "employee_name": "Ramesh"
              }
            ]
          },
          {
            "id": "srv-1785853236675-l8pj",
            "remarks": "",
            "end_time": "14:00",
            "quantity": 1,
            "service_id": "srv-3",
            "start_time": "08:00",
            "service_name": "Traditional Videography",
            "assigned_team": [
              {
                "role_title": "Traditional Videographer",
                "employee_id": "fl-1785768094147",
                "employee_name": "Sreekar Babu"
              }
            ]
          }
        ],
        "event_date": "2026-08-17",
        "event_time": "08:00",
        "event_type_id": "et-4",
        "event_type_name": "Haldi",
        "google_map_link": ""
      },
      {
        "id": "ev-1785853261321",
        "notes": "",
        "venue": "",
        "services": [
          {
            "id": "srv-1785853314579-vlvv",
            "remarks": "",
            "end_time": "16:00",
            "quantity": 1,
            "service_id": "srv-1",
            "start_time": "08:00",
            "service_name": "Traditional Photography",
            "assigned_team": [
              {
                "role_title": "Traditional Photographer",
                "employee_id": "emp-1785767911514",
                "employee_name": "Ramesh"
              }
            ]
          },
          {
            "id": "srv-1785853333848-u8lp",
            "remarks": "",
            "end_time": "16:00",
            "quantity": 1,
            "service_id": "srv-3",
            "start_time": "08:00",
            "service_name": "Traditional Videography",
            "assigned_team": [
              {
                "role_title": "Traditional Videographer",
                "employee_id": "fl-1785768094147",
                "employee_name": "Sreekar Babu"
              }
            ]
          }
        ],
        "event_date": "2026-08-18",
        "event_time": "08:00",
        "event_type_id": "et-5",
        "event_type_name": "Sangeet / Mehendi",
        "google_map_link": ""
      },
      {
        "id": "ev-1785853356617",
        "notes": "",
        "venue": "",
        "services": [
          {
            "id": "srv-1785853375900-3t03",
            "remarks": "",
            "end_time": "23:00",
            "quantity": 1,
            "service_id": "srv-1",
            "start_time": "17:00",
            "service_name": "Traditional Photography",
            "assigned_team": [
              {
                "role_title": "Traditional Photographer",
                "employee_id": "emp-1785767911514",
                "employee_name": "Ramesh"
              }
            ]
          },
          {
            "id": "srv-1785853400125-d67e",
            "remarks": "",
            "end_time": "23:00",
            "quantity": 1,
            "service_id": "srv-3",
            "start_time": "17:00",
            "service_name": "Traditional Videography",
            "assigned_team": [
              {
                "role_title": "Traditional Videographer",
                "employee_id": "fl-1785768094147",
                "employee_name": "Sreekar Babu"
              }
            ]
          },
          {
            "id": "srv-1785853420848-e689",
            "remarks": "",
            "end_time": "23:00",
            "quantity": 1,
            "service_id": "srv-2",
            "start_time": "17:00",
            "service_name": "Candid Photography",
            "assigned_team": [
              {
                "role_title": "Candid Photographer",
                "employee_id": "fl-1785768027743",
                "employee_name": "Chidananda"
              }
            ]
          },
          {
            "id": "srv-1785853454140-y0kb",
            "remarks": "",
            "end_time": "23:00",
            "quantity": 1,
            "service_id": "srv-6",
            "start_time": "17:00",
            "service_name": "LED Display Wall",
            "assigned_team": []
          },
          {
            "id": "srv-1785855635824-1qzn",
            "remarks": "",
            "end_time": "23:00",
            "quantity": 1,
            "service_id": "srv-1785855532905",
            "start_time": "06:00",
            "service_name": "Spot Video Mixing",
            "assigned_team": []
          }
        ],
        "event_date": "2026-08-18",
        "event_time": "17:00",
        "event_type_id": "et-2",
        "event_type_name": "Reception",
        "google_map_link": ""
      },
      {
        "id": "ev-1785853507879",
        "notes": "",
        "venue": "",
        "services": [
          {
            "id": "srv-1785853524589-y20h",
            "remarks": "",
            "end_time": "14:00",
            "quantity": 1,
            "service_id": "srv-1",
            "start_time": "06:00",
            "service_name": "Traditional Photography",
            "assigned_team": [
              {
                "role_title": "Traditional Photographer",
                "employee_id": "emp-1785767911514",
                "employee_name": "Ramesh"
              }
            ]
          },
          {
            "id": "srv-1785853539815-oqq3",
            "remarks": "",
            "end_time": "14:00",
            "quantity": 1,
            "service_id": "srv-3",
            "start_time": "06:00",
            "service_name": "Traditional Videography",
            "assigned_team": [
              {
                "role_title": "Traditional Videographer",
                "employee_id": "fl-1785768094147",
                "employee_name": "Sreekar Babu"
              }
            ]
          },
          {
            "id": "srv-1785853558970-a74x",
            "remarks": "",
            "end_time": "14:00",
            "quantity": 1,
            "service_id": "srv-2",
            "start_time": "06:00",
            "service_name": "Candid Photography",
            "assigned_team": [
              {
                "role_title": "Candid Photographer",
                "employee_id": "fl-1785768027743",
                "employee_name": "Chidananda"
              }
            ]
          }
        ],
        "event_date": "2026-08-19",
        "event_time": "06:00",
        "event_type_id": "et-1",
        "event_type_name": "Wedding",
        "google_map_link": ""
      }
    ],
    "mobile": "9972231298",
    "source": null,
    "status": "upcoming",
    "payment": {
      "ledger": [
        {
          "id": "pay-1785853687572-2pmm",
          "notes": "Booking Advance received",
          "amount": 5000,
          "created_at": "2026-08-04T14:28:07.572Z",
          "received_by": "Admin",
          "payment_date": "2026-05-07",
          "payment_mode": "UPI",
          "transaction_ref": "8376575"
        },
        {
          "id": "pay-1785853722200-47gs",
          "notes": "Booking Advance received",
          "amount": 50000,
          "created_at": "2026-08-04T14:28:42.200Z",
          "received_by": "Admin",
          "payment_date": "2026-07-31",
          "payment_mode": "Bank Transfer",
          "transaction_ref": "8376575"
        }
      ],
      "gst_amount": 0,
      "net_amount": 150000,
      "gst_percent": 0,
      "balance_amount": 95000,
      "package_amount": 150000,
      "payment_status": "advance_received",
      "amount_received": 55000,
      "discount_amount": 0
    },
    "contract": {
      "title": "Standard Wedding Photography & Videography Agreement",
      "status": "pending",
      "valid_until": "2026-09-30",
      "terms_content": "<h2>1. Booking & Retainer</h2>\n<p>A non-refundable retainer fee of <strong>25%</strong> is required upon signing this contract to secure the shoot date(s). The balance amount shall be paid as per the agreed payment schedule.</p>\n\n<h2>2. Coverage & Services</h2>\n<p>Trufocus Photography agrees to provide the photographic and videographic coverage detailed in the Work Order. Any extra hours or additional services requested on-site will be billed separately.</p>\n\n<h2>3. Deliverables & Timeline</h2>\n<ul>\n  <li><strong>Edited High-Resolution Photos:</strong> Delivered within 21 to 30 working days after selection.</li>\n  <li><strong>Cinematic Teaser & Highlight Video:</strong> Delivered within 45 working days post-event.</li>\n  <li><strong>Photobooks & Printed Media:</strong> Delivered within 30 days after client album proof approval.</li>\n</ul>\n\n<h2>4. Copyright & Usage Rights</h2>\n<p>Trufocus Photography retains copyright for all images and video footage. The client is granted a non-exclusive license for personal usage, printing, and social media sharing.</p>\n\n<h2>5. Cancellation & Rescheduling</h2>\n<p>In the event of cancellation by the client, retainer payments remain non-refundable. Rescheduling is subject to studio calendar availability.</p>",
      "agreement_date": "2026-08-04",
      "agreement_number": "AGR-783806",
      "studio_signature": "Trufocus Photography",
      "customer_signature": ""
    },
    "is_draft": false,
    "created_at": "2026-08-04T14:29:43.806Z",
    "created_by": "usr_cloud_lookup",
    "deleted_at": null,
    "enquiry_id": null,
    "event_type": "Wedding",
    "updated_at": "2026-08-04T15:08:51.537Z",
    "balance_due": 95000,
    "booking_date": "2026-05-07",
    "contract_url": null,
    "deliverables": [
      {
        "name": "Edited Photos",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-1"
      },
      {
        "name": "Traditional Video",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-2"
      },
      {
        "name": "Cinematic Film",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-3"
      },
      {
        "name": "Instagram Reel",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-4"
      },
      {
        "name": "Highlight Film",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-5"
      },
      {
        "name": "Luxury Album",
        "notes": "2 Albums",
        "is_included": true,
        "deliverable_id": "del-6"
      },
      {
        "name": "Mini Album",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-7"
      },
      {
        "name": "Photo Frame",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-8"
      },
      {
        "name": "Canvas Print",
        "notes": "",
        "is_included": false,
        "deliverable_id": "del-9"
      },
      {
        "name": "Pen Drive",
        "notes": "",
        "is_included": true,
        "deliverable_id": "del-10"
      },
      {
        "name": "Online Gallery",
        "notes": "Trufocus Event Gallery",
        "is_included": true,
        "deliverable_id": "del-11"
      }
    ],
    "project_name": "Nageshwari & Sridhan's Wedding",
    "customer_name": "Swetha",
    "package_total": 150000,
    "payment_status": "advance_received",
    "pinterest_link": null,
    "amount_received": 55000,
    "contract_status": "pending",
    "google_map_link": null,
    "whatsapp_number": null,
    "alternate_mobile": null,
    "progress_percent": 15,
    "work_order_number": "WO-2025-317",
    "album_delivery_date": "2026-09-15",
    "final_delivery_date": "2026-09-15",
    "contract_accepted_at": "2026-08-04",
    "special_instructions": null
  }
]





export function getLocalWorkOrders(): WorkOrder[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_WO_KEY)
    if (raw) {
      const items: WorkOrder[] = JSON.parse(raw)
      if (Array.isArray(items) && items.length > 0) {
        return items.map((wo) => recalculateWorkOrderFinancials(wo))
      }
    }
  } catch (e) {
    console.error('Failed reading local work orders', e)
  }
  try {
    localStorage.setItem(LOCAL_STORAGE_WO_KEY, JSON.stringify(INITIAL_FALLBACK_WORK_ORDERS))
  } catch {}
  return INITIAL_FALLBACK_WORK_ORDERS.map((wo) => recalculateWorkOrderFinancials(wo))
}

export function saveLocalWorkOrdersOnly(items: WorkOrder[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_WO_KEY, JSON.stringify(items))
  } catch (e) {
    console.error('Failed saving local work orders to storage', e)
  }
}

export function saveLocalWorkOrders(items: WorkOrder[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_WO_KEY, JSON.stringify(items))
    pushEntityToCloud('work_orders', 'main', items)
  } catch (e) {
    console.error('Failed saving local work orders', e)
  }
}

export function isWorkOrderContractSigned(wo: WorkOrder | null | undefined): boolean {
  if (!wo || wo.deleted_at || wo.status === 'deleted') return false
  return (
    wo.contract_status === 'signed' ||
    Boolean(wo.contract?.customer_signature && wo.contract.customer_signature.trim().length > 0) ||
    Boolean(wo.contract_accepted_at && wo.contract_accepted_at.trim().length > 0) ||
    Boolean(wo.acknowledgement && wo.acknowledgement.acknowledged === true)
  )
}

export async function signWorkOrderContract(
  workOrderIdOrNumber: string,
  signatureName: string,
  device = 'Desktop',
  browser = 'Chrome'
): Promise<{ success: boolean; message: string; updatedWorkOrder?: WorkOrder }> {
  const existingList = getLocalWorkOrders()
  const woIndex = existingList.findIndex(
    (w) =>
      w.id === workOrderIdOrNumber ||
      w.work_order_number.toLowerCase() === workOrderIdOrNumber.toLowerCase()
  )

  if (woIndex === -1) {
    return { success: false, message: 'Work Order not found.' }
  }

  const wo = existingList[woIndex]
  const now = new Date().toISOString()

  wo.contract_status = 'signed'
  wo.contract_accepted_at = now

  if (!wo.contract) {
    wo.contract = {
      title: 'Photography Agreement',
      agreement_number: `TRF-AGR-${wo.work_order_number.replace(/\D/g, '') || Date.now()}`,
      agreement_date: now.split('T')[0],
      valid_until: '',
      customer_signature: signatureName,
      studio_signature: 'Trufocus Director',
      terms_content: '<h2>Agreement Terms</h2><p>Standard photography agreement and terms apply.</p>',
      status: 'signed',
    }
  } else {
    wo.contract.customer_signature = signatureName
    wo.contract.status = 'signed'
  }

  wo.acknowledgement = {
    id: 'ack_' + Date.now(),
    work_order_id: wo.id,
    acknowledged: true,
    acknowledged_at: now,
    customer_name: signatureName || wo.customer_name,
    device,
    browser,
    created_at: now,
  }

  wo.updated_at = now

  if (!wo.activity_logs) wo.activity_logs = []
  wo.activity_logs.unshift({
    id: 'act_' + Date.now(),
    action: 'Digital Contract Signed & Project Acknowledged',
    user: signatureName || wo.customer_name,
    date: now,
    details: `Digitally signed contract agreement ('${signatureName}') from ${device} (${browser})`,
  })

  existingList[woIndex] = wo

  saveLocalWorkOrders(existingList)
  await pushEntityToCloud('work_orders', 'main', existingList)

  try {
    await supabase.from('work_orders').upsert({
      id: wo.id,
      data: wo,
      updated_at: now,
    })
  } catch (e) {
    console.warn('Direct Supabase write notice:', e)
  }

  broadcastPaymentSync({ workOrderId: wo.id, action: 'CONTRACT_SIGNED' })

  return { success: true, message: '🎉 Contract digitally signed and accepted!', updatedWorkOrder: wo }
}

// ─── Fetch List ───────────────────────────────────────────────────────────────

function applyDateRangeFilter(items: WorkOrder[], range: WorkOrderFilters['date_range']): WorkOrder[] {
  if (!range || range === 'all') return items

  const todayStr = new Date().toISOString().split('T')[0]

  if (range === 'today') {
    return items.filter((w) => {
      const bDate = w.booking_date || (w.events && w.events[0]?.event_date) || ''
      return bDate === todayStr || (w.events || []).some((e) => e.event_date === todayStr)
    })
  }

  if (range === 'this_week') {
    const now = new Date()
    const day = now.getDay()
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day).toISOString().split('T')[0]
    const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - day)).toISOString().split('T')[0]

    return items.filter((w) => {
      const bDate = w.booking_date || (w.events && w.events[0]?.event_date) || ''
      return (bDate >= weekStart && bDate <= weekEnd) || (w.events || []).some((e) => e.event_date >= weekStart && e.event_date <= weekEnd)
    })
  }

  if (range === 'this_month') {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    return items.filter((w) => {
      const bDate = w.booking_date || (w.events && w.events[0]?.event_date) || ''
      return (bDate >= monthStart && bDate <= monthEnd) || (w.events || []).some((e) => e.event_date >= monthStart && e.event_date <= monthEnd)
    })
  }

  return items
}

export async function fetchWorkOrders(
  filters: WorkOrderFilters,
  sort: SortConfig,
  page: number,
  pageSize: number
): Promise<PaginatedResult<WorkOrder>> {
  if (isCloudConfigured()) {
    try {
      const { data, error } = await supabase.from(TABLE).select('*')
      if (!error && data && data.length > 0) {
        const cloudItems = extractEntitiesFromCloudRows<WorkOrder>(data)
        if (cloudItems.length > 0) {
          const localItems = getLocalWorkOrders()
          const mergedMap = new Map<string, WorkOrder>()

          cloudItems.forEach((w) => mergedMap.set(w.id || w.work_order_number, w))
          localItems.forEach((w) => {
            const key = w.id || w.work_order_number
            if (key && !mergedMap.has(key)) mergedMap.set(key, w)
          })

          const mergedList = Array.from(mergedMap.values())
          saveLocalWorkOrdersOnly(mergedList)
        }
      }
    } catch (e) {
      console.warn('[WorkOrders] Exception fetching cloud work orders:', e)
    }
  }

  return fetchWorkOrdersLocal(filters, sort, page, pageSize)
}

export function fetchWorkOrdersLocal(
  filters: WorkOrderFilters,
  sort: SortConfig,
  page: number,
  pageSize: number
): PaginatedResult<WorkOrder> {
  let list = getLocalWorkOrders().filter(w => !w.is_draft && !w.deleted_at && w.status !== 'deleted')

  list = filterWorkOrdersList(list, filters.status, filters.search)

  if (filters.event_type !== 'all') list = list.filter(w => w.event_type === filters.event_type)
  if (filters.payment_status !== 'all') list = list.filter(w => w.payment_status === filters.payment_status)
  if (filters.date_range && filters.date_range !== 'all') {
    list = applyDateRangeFilter(list, filters.date_range)
  }

  // Sort
  list.sort((a, b) => {
    const aval = (a as any)[sort.field] ?? ''
    const bval = (b as any)[sort.field] ?? ''
    if (sort.direction === 'asc') return aval > bval ? 1 : -1
    return aval < bval ? 1 : -1
  })

  const total = list.length
  const from = (page - 1) * pageSize
  const pagedItems = list.slice(from, from + pageSize)

  return {
    items: pagedItems,
    meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  }
}

export async function fetchWorkOrder(id: string): Promise<WorkOrder | null> {
  if (!id) return null
  const localList = getLocalWorkOrders()
  const local = localList.find((w) => w.id === id || w.work_order_number.toLowerCase() === id.toLowerCase())

  if (local) {
    return local
  }

  if (isCloudConfigured()) {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .or(`id.eq.${id},work_order_number.eq.${id}`)
        .limit(1)

      if (!error && data && data.length > 0) {
        const cloudItems = extractEntitiesFromCloudRows<WorkOrder>(data)
        if (cloudItems.length > 0) {
          const found = cloudItems[0]
          const updatedList = [found, ...localList.filter((w) => w.id !== found.id && w.work_order_number !== found.work_order_number)]
          saveLocalWorkOrdersOnly(updatedList)
          return found
        }
      }
    } catch (e) {
      console.warn('[WorkOrders] Exception fetching single work order from cloud:', e)
    }
  }

  return null
}

// ─── Create (from Wizard) ─────────────────────────────────────────────────────

export async function createWorkOrder(
  wizard: WorkOrderWizardData,
  userId: string,
  isDraft = false
): Promise<ApiResponse<WorkOrder>> {
  return createWorkOrderLocal(wizard, userId, isDraft)
}

function createWorkOrderLocal(
  wizard: WorkOrderWizardData,
  userId: string,
  isDraft = false
): ApiResponse<WorkOrder> {
  const packageAmt = parseFloat(wizard.payment?.package_amount || '0') || 0
  const discountAmt = parseFloat(wizard.payment?.discount_amount || '0') || 0
  const gstPct = parseFloat(wizard.payment?.gst_percent || '0') || 0
  const gstAmt = wizard.payment?.gst_applicable ? (packageAmt * gstPct) / 100 : 0
  const netAmt = packageAmt + gstAmt - discountAmt
  const amountReceived = (wizard.payment?.ledger || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const balanceAmt = Math.max(0, netAmt - amountReceived)

  const paymentStatus: PaymentStatus =
    amountReceived <= 0 ? 'pending'
    : balanceAmt <= 0 ? 'fully_paid'
    : 'partially_paid'

  const contractStatus: ContractStatus = wizard.contract?.customer_signature ? 'signed' : 'pending'

  // Generate sequential WO number
  const year = new Date().getFullYear()
  const existing = getLocalWorkOrders()
  let maxNum = 0
  existing.forEach(w => {
    const match = w.work_order_number?.match(/WO-\d+-(\d+)/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (!isNaN(num) && num > maxNum) maxNum = num
    }
  })
  const nextNum = maxNum + 1
  const seqStr = nextNum.toString().padStart(3, '0')
  const workOrderNumber = `WO-${year}-${seqStr}`

  const newWO: WorkOrder = {
    id: 'wo-' + Date.now(),
    work_order_number: workOrderNumber,
    project_name: wizard.project_name?.trim() || 'New Project',
    customer_name: wizard.customer_name?.trim() || 'Customer',
    mobile: wizard.mobile?.trim() || '',
    whatsapp_number: wizard.whatsapp_number?.trim() || null,
    alternate_mobile: wizard.alternate_mobile?.trim() || null,
    email: wizard.email?.trim() || null,
    event_type: wizard.event_type || 'Wedding',
    booking_date: wizard.booking_date || new Date().toISOString().split('T')[0],
    source: wizard.source || null,
    enquiry_id: null,
    venue: wizard.venue?.trim() || null,
    city: wizard.city?.trim() || null,
    google_map_link: wizard.google_map_link?.trim() || null,
    notes: wizard.notes?.trim() || null,
    status: 'upcoming',
    payment_status: paymentStatus,
    contract_status: contractStatus,
    progress_percent: 15,
    pinterest_link: wizard.pinterest_link?.trim() || null,
    special_instructions: wizard.special_instructions?.trim() || null,
    contract_url: null,
    contract_accepted_at: wizard.contract?.customer_signature ? new Date().toISOString().split('T')[0] : null,
    final_delivery_date: wizard.final_delivery_date || null,
    album_delivery_date: wizard.album_delivery_date || null,
    is_draft: isDraft,
    created_by: userId,
    deleted_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    events: (wizard.events || []) as any,
    deliverables: (wizard.deliverables || []) as any,
    payment: {
      package_amount: packageAmt,
      discount_amount: discountAmt,
      gst_applicable: wizard.payment?.gst_applicable ?? false,
      gst_percent: gstPct,
      gst_amount: gstAmt,
      net_amount: netAmt,
      amount_received: amountReceived,
      balance_amount: balanceAmt,
      payment_status: paymentStatus,
      ledger: wizard.payment?.ledger || [],
    },
    contract: {
      title: wizard.contract?.title || 'Standard Photography Agreement',
      agreement_number: wizard.contract?.agreement_number || `AGR-${Date.now().toString().slice(-6)}`,
      agreement_date: wizard.contract?.agreement_date || new Date().toISOString().split('T')[0],
      valid_until: wizard.contract?.valid_until || '',
      customer_signature: wizard.contract?.customer_signature || '',
      studio_signature: wizard.contract?.studio_signature || 'Trufocus Director',
      terms_content: wizard.contract?.terms_content || '<h2>Agreement Terms</h2>',
      status: contractStatus,
    },
  }

  saveLocalWorkOrders([newWO, ...existing])
  try {
    getOrCreatePortalForWorkOrder(newWO)
  } catch (e) {
    console.error('Error auto-creating portal for work order:', e)
  }
  broadcastPaymentSync({ action: 'WORK_ORDER_CREATED', id: newWO.id })
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('workOrdersUpdated'))
  }
  return { data: newWO, error: null }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateWorkOrder(
  id: string,
  updates: Partial<WorkOrder>
): Promise<ApiResponse<WorkOrder>> {
  return updateWorkOrderLocal(id, updates)
}

export function recalculateWorkOrderFinancials(wo: WorkOrder): WorkOrder {
  const packageTotal = typeof wo.payment?.package_amount === 'number'
    ? wo.payment.package_amount
    : (parseFloat(String(wo.payment?.package_amount || wo.package_total || '0')) || 0)
  const discountAmt = typeof wo.payment?.discount_amount === 'number'
    ? wo.payment.discount_amount
    : (parseFloat(String(wo.payment?.discount_amount || '0')) || 0)
  const gstPct = typeof wo.payment?.gst_percent === 'number'
    ? wo.payment.gst_percent
    : (parseFloat(String(wo.payment?.gst_percent || '0')) || 0)
  const gstAmt = wo.payment?.gst_applicable ? (packageTotal * gstPct) / 100 : 0
  const netTotal = packageTotal + gstAmt - discountAmt

  const ledgerList = [...(wo.payment?.ledger || [])]

  // Read payments from finances store
  let storePayments: any[] = []
  try {
    const raw = localStorage.getItem('trufocus_crm_payments_v1')
    if (raw) storePayments = JSON.parse(raw)
  } catch {}

  const matchingStorePayments = storePayments.filter(
    (p: any) => (p.work_order_id === wo.id || p.work_order_number === wo.work_order_number) && p.status === 'completed'
  )

  matchingStorePayments.forEach((p: any) => {
    const exists = ledgerList.some((l) => l.id === p.id)
    if (!exists) {
      ledgerList.push({
        id: p.id,
        work_order_id: wo.id,
        payment_date: p.payment_date,
        amount: p.amount,
        payment_mode: p.payment_mode,
        transaction_ref: p.transaction_ref || p.receipt_number || '',
        received_by: p.received_by || 'Studio Accounts',
        notes: p.remarks || '',
        created_at: p.created_at,
      })
    }
  })

  const amountReceived = ledgerList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const balanceDue = Math.max(0, netTotal - amountReceived)

  let paymentStatus: PaymentStatus = 'pending'
  if (amountReceived >= netTotal && netTotal > 0) {
    paymentStatus = 'fully_paid'
  } else if (amountReceived > 0) {
    paymentStatus = amountReceived >= (netTotal * 0.25) ? 'advance_received' : 'partially_paid'
  }

  return {
    ...wo,
    package_total: packageTotal,
    amount_received: amountReceived,
    balance_due: balanceDue,
    payment_status: paymentStatus,
    payment: {
      ...wo.payment,
      package_amount: packageTotal,
      discount_amount: discountAmt,
      gst_percent: gstPct,
      gst_amount: gstAmt,
      net_amount: netTotal,
      amount_received: amountReceived,
      balance_amount: balanceDue,
      payment_status: paymentStatus,
      ledger: ledgerList,
    },
    updated_at: new Date().toISOString(),
  }
}

function updateWorkOrderLocal(id: string, updates: Partial<WorkOrder>): ApiResponse<WorkOrder> {
  const existing = getLocalWorkOrders()
  let updatedWO: WorkOrder | null = null
  const updatedList = existing.map(item => {
    if (item.id === id || item.work_order_number === id) {
      const merged: WorkOrder = {
        ...item,
        ...updates,
        payment: updates.payment ? { ...item.payment, ...updates.payment } : item.payment,
        contract: updates.contract ? { ...item.contract, ...updates.contract } : item.contract,
      }
      updatedWO = recalculateWorkOrderFinancials(merged)
      return updatedWO
    }
    return item
  })

  if (updatedWO) {
    saveLocalWorkOrders(updatedList)
    broadcastPaymentSync({ action: 'WORK_ORDER_UPDATED', id: (updatedWO as WorkOrder).id })
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('workOrdersUpdated'))
  }
  return { data: updatedWO, error: updatedWO ? null : 'Work order not found' }
}

// ─── Soft Delete ──────────────────────────────────────────────────────────────

export async function deleteWorkOrder(id: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from(TABLE).update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) {
      deleteWorkOrderLocal(id)
    }
  } catch {
    deleteWorkOrderLocal(id)
  }
  return { data: null, error: null }
}

function deleteWorkOrderLocal(id: string) {
  const existing = getLocalWorkOrders()
  const filtered = existing.filter(item => item.id !== id)
  saveLocalWorkOrders(filtered)
}

// ─── Export CSV ───────────────────────────────────────────────────────────────

export function exportWorkOrdersCSV(workOrders: WorkOrder[]): string {
  const headers = [
    'WO Number', 'Project Name', 'Customer', 'Mobile', 'Event Type',
    'City', 'Status', 'Payment Status', 'Contract Status', 'Progress %', 'Created',
  ]
  const rows = workOrders.map((w) => [
    w.work_order_number, w.project_name, w.customer_name, w.mobile,
    w.event_type, w.city ?? '', w.status, w.payment_status,
    w.contract_status, w.progress_percent, new Date(w.created_at).toLocaleDateString(),
  ])
  return [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n')
}

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ─── Central Payment Recording ────────────────────────────────────────────────

export interface RecordPaymentParams {
  workOrderId: string
  amount: number
  paymentDate: string
  paymentMode: string
  transactionRef?: string
  receivedBy?: string
  notes?: string
  receiptUrl?: string
}

export interface RecordPaymentResult {
  paymentEntry: WorkOrderPaymentLedger
  updatedWorkOrder: WorkOrder
  receiptNumber: string
  balanceRemaining: number
}

export async function recordWorkOrderPayment(
  params: RecordPaymentParams
): Promise<ApiResponse<RecordPaymentResult>> {
  const { workOrderId, amount, paymentDate, paymentMode, transactionRef, receivedBy, notes } = params

  if (amount <= 0) {
    return { data: null, error: 'Payment amount must be greater than zero.' }
  }

  const existingList = getLocalWorkOrders()
  const woIndex = existingList.findIndex(w => w.id === workOrderId || w.work_order_number === workOrderId)
  if (woIndex === -1) {
    return { data: null, error: 'Work Order not found in database.' }
  }

  const targetWO = existingList[woIndex]
  const currentTotal = typeof targetWO.payment?.package_amount === 'number' ? targetWO.payment.package_amount : (typeof targetWO.package_total === 'number' ? targetWO.package_total : 0)
  const currentReceived = typeof targetWO.payment?.amount_received === 'number' ? targetWO.payment.amount_received : (targetWO.amount_received || 0)
  const currentBalance = Math.max(0, currentTotal - currentReceived)

  if (amount > currentBalance && currentBalance > 0) {
    return { data: null, error: `Payment amount (₹${amount.toLocaleString()}) cannot exceed remaining balance (₹${currentBalance.toLocaleString()}).` }
  }

  // SINGLE SOURCE OF TRUTH: Delegate to recordCustomerPayment in financeStore
  const newPayment = recordCustomerPayment({
    work_order_id: targetWO.id,
    work_order_number: targetWO.work_order_number,
    customer_name: targetWO.customer_name,
    amount: amount,
    payment_date: paymentDate,
    payment_mode: paymentMode as any,
    transaction_ref: transactionRef,
    received_by: receivedBy || 'Studio Accounts',
    remarks: notes || '',
  })

  // Refreshed Work Order state
  const refreshedList = getLocalWorkOrders()
  const updatedWO = refreshedList.find(w => w.id === targetWO.id) || targetWO
  const updatedBalance = updatedWO.payment?.balance_amount ?? Math.max(0, currentTotal - (currentReceived + amount))

  const ledgerEntry: WorkOrderPaymentLedger = {
    id: newPayment.id,
    work_order_id: targetWO.id,
    payment_date: paymentDate,
    amount: amount,
    payment_mode: paymentMode,
    transaction_ref: transactionRef || newPayment.receipt_number,
    received_by: receivedBy || 'Studio Accounts',
    notes: notes || '',
    created_at: newPayment.created_at,
  }

  try {
    await supabase.from(TABLE).update({
      payment_status: updatedWO.payment_status,
      updated_at: new Date().toISOString(),
    }).eq('id', targetWO.id)
  } catch {
    // Graceful fallback
  }

  try {
    broadcastPaymentSync({ workOrderId: targetWO.id, amount, receiptNum: newPayment.receipt_number })
  } catch (e) {
    console.error('Failed broadcasting payment sync:', e)
  }

  return {
    data: {
      paymentEntry: ledgerEntry,
      updatedWorkOrder: updatedWO,
      receiptNumber: newPayment.receipt_number,
      balanceRemaining: updatedBalance,
    },
    error: null,
  }
}

/**
 * Update event Google Maps location link (2-way sync between Client Portal & CRM)
 */
export function updateEventGoogleMapsLink(
  workOrderId: string,
  eventId: string,
  googleMapsUrl: string,
  updatedBy = 'Customer'
): { success: boolean; message: string } {
  const existingList = getLocalWorkOrders()
  const woIndex = existingList.findIndex(
    (w) => w.id === workOrderId || w.work_order_number === workOrderId
  )

  if (woIndex === -1) {
    return { success: false, message: 'Work Order not found.' }
  }

  const wo = existingList[woIndex]
  if (!wo.events) wo.events = []

  let eventName = 'Event Shoot'
  const eventIdx = wo.events.findIndex((e) => e.id === eventId || e.event_type_name === eventId)
  if (eventIdx !== -1) {
    wo.events[eventIdx].google_map_link = googleMapsUrl
    eventName = wo.events[eventIdx].event_type_name || 'Event Shoot'
  } else if (wo.events.length > 0) {
    wo.events[0].google_map_link = googleMapsUrl
    eventName = wo.events[0].event_type_name || 'Event Shoot'
  }

  wo.updated_at = new Date().toISOString()

  // Record Activity Log
  if (!wo.activity_logs) wo.activity_logs = []
  wo.activity_logs.unshift({
    id: 'act_' + Date.now(),
    action: `Google Maps Location Updated (${eventName})`,
    user: updatedBy,
    date: new Date().toISOString(),
    details: `Updated Google Maps link to ${googleMapsUrl}`,
  })

  existingList[woIndex] = wo

  try {
    localStorage.setItem(LOCAL_STORAGE_WO_KEY, JSON.stringify(existingList))
    broadcastPaymentSync({ workOrderId: wo.id, eventId, updatedBy })
  } catch (e) {
    console.error('Error saving updated Google Maps link:', e)
  }

  return { success: true, message: 'Venue location saved successfully.' }
}

/**
 * Update or Publish Project Gallery (CRM <-> Client Portal)
 */
export function updateProjectGallery(
  workOrderId: string,
  galleryData: Partial<import('@/types/workOrders').ProjectGallery> | null,
  action: 'publish' | 'update' | 'remove' = 'publish',
  updatedBy = 'Admin'
): { success: boolean; message: string; gallery?: import('@/types/workOrders').ProjectGallery } {
  const existingList = getLocalWorkOrders()
  const woIndex = existingList.findIndex(
    (w) => w.id === workOrderId || w.work_order_number === workOrderId
  )

  if (woIndex === -1) {
    return { success: false, message: 'Work Order not found.' }
  }

  const wo = existingList[woIndex]
  const now = new Date().toISOString()

  if (action === 'remove' || !galleryData) {
    delete wo.gallery
    if (!wo.activity_logs) wo.activity_logs = []
    wo.activity_logs.unshift({
      id: 'act_' + Date.now(),
      action: 'Project Gallery Removed',
      user: updatedBy,
      date: now,
      details: `Removed online gallery link for ${wo.project_name}`,
    })
  } else {
    const updatedGallery: import('@/types/workOrders').ProjectGallery = {
      id: wo.gallery?.id || 'gal_' + Date.now(),
      work_order_id: wo.id,
      gallery_name: galleryData.gallery_name || `${wo.project_name} Gallery`,
      gallery_url: galleryData.gallery_url || '',
      gallery_password: galleryData.gallery_password || '',
      status: galleryData.status || 'published',
      publish_date: galleryData.publish_date || now.split('T')[0],
      expiry_date: galleryData.expiry_date || '',
      created_by: updatedBy,
      updated_at: now,
    }

    wo.gallery = updatedGallery

    if (!wo.activity_logs) wo.activity_logs = []
    wo.activity_logs.unshift({
      id: 'act_' + Date.now(),
      action: action === 'publish' ? 'Online Photo Gallery Published' : 'Project Gallery Updated',
      user: updatedBy,
      date: now,
      details: `Published gallery '${updatedGallery.gallery_name}' (${updatedGallery.gallery_url})`,
    })
  }

  wo.updated_at = now
  existingList[woIndex] = wo

  try {
    localStorage.setItem(LOCAL_STORAGE_WO_KEY, JSON.stringify(existingList))
    broadcastPaymentSync({ workOrderId: wo.id, galleryAction: action, updatedBy })
  } catch (e) {
    console.error('Error saving project gallery:', e)
  }

  const msg =
    action === 'publish'
      ? '🎉 Gallery published successfully!'
      : action === 'remove'
      ? 'Gallery removed successfully.'
      : 'Gallery updated successfully.'

  return { success: true, message: msg, gallery: wo.gallery }
}

/**
 * Customer Acknowledgement Submission (delegates to signWorkOrderContract)
 */
export async function acknowledgeWorkOrder(
  workOrderId: string,
  customerName: string,
  device = 'Desktop',
  browser = 'Chrome'
): Promise<{ success: boolean; message: string; updatedWorkOrder?: WorkOrder }> {
  return signWorkOrderContract(workOrderId, customerName, device, browser)
}

/**
 * Admin Force Re-acknowledgement / Reset Contract Signature
 */
export async function resetWorkOrderAcknowledgement(
  workOrderId: string,
  updatedBy = 'Admin'
): Promise<{ success: boolean; message: string }> {
  const existingList = getLocalWorkOrders()
  const woIndex = existingList.findIndex(
    (w) => w.id === workOrderId || w.work_order_number === workOrderId
  )

  if (woIndex === -1) {
    return { success: false, message: 'Work Order not found.' }
  }

  const wo = existingList[woIndex]
  const now = new Date().toISOString()

  wo.contract_status = 'pending'
  wo.contract_accepted_at = null
  if (wo.contract) {
    wo.contract.customer_signature = ''
    wo.contract.status = 'pending'
  }

  wo.acknowledgement = {
    id: 'ack_' + Date.now(),
    work_order_id: wo.id,
    acknowledged: false,
    acknowledged_at: null,
    customer_name: wo.customer_name,
  }

  wo.updated_at = now

  if (!wo.activity_logs) wo.activity_logs = []
  wo.activity_logs.unshift({
    id: 'act_' + Date.now(),
    action: 'Contract Signature & Acknowledgement Reset',
    user: updatedBy,
    date: now,
    details: `Admin reset contract status. Customer must re-sign updated contract upon next portal access`,
  })

  existingList[woIndex] = wo

  saveLocalWorkOrders(existingList)
  await pushEntityToCloud('work_orders', 'main', existingList)

  try {
    await supabase.from('work_orders').upsert({
      id: wo.id,
      data: wo,
      updated_at: now,
    })
  } catch (e) {
    console.warn('Direct Supabase write notice on reset:', e)
  }

  broadcastPaymentSync({ workOrderId: wo.id, action: 'ACKNOWLEDGEMENT_RESET' })

  return { success: true, message: 'Contract signature reset. Customer must re-sign upon next portal access.' }
}

/**
 * Directly fetch single Work Order from Supabase Cloud DB for Client Portal verification
 */
export async function fetchWorkOrderFromSupabase(workOrderNumberOrId: string): Promise<WorkOrder | null> {
  if (!workOrderNumberOrId) return null
  const clean = workOrderNumberOrId.toUpperCase()

  // 1. Check local cache first
  const localList = getLocalWorkOrders()
  let wo = localList.find(
    (w) => w.work_order_number.toUpperCase() === clean || w.id.toUpperCase() === clean
  )

  // 2. Query Supabase directly
  try {
    const remoteRows = await pullTableFromCloud('work_orders')
    if (remoteRows && remoteRows.length > 0) {
      const flat = Array.isArray(remoteRows[0]) ? remoteRows[0] : remoteRows
      const matched = flat.find(
        (w: any) =>
          w &&
          (w.work_order_number?.toUpperCase() === clean || w.id?.toUpperCase() === clean)
      )

      if (matched) {
        wo = matched
        // Sync back to local store
        const idx = localList.findIndex((w) => w.id === matched.id || w.work_order_number === matched.work_order_number)
        if (idx !== -1) {
          localList[idx] = matched
        } else {
          localList.unshift(matched)
        }
        saveLocalWorkOrders(localList)
      }
    }
  } catch (e) {
    console.warn('Notice: Exception fetching Work Order from Supabase Cloud DB:', e)
  }

  return wo || null
}

// ─── Soft Delete & Trash Operations ──────────────────────────────────────────

import { logLoginAudit } from '@/services/employeeService'

export function purgeWorkOrderDataFromEverywhere(id: string, workOrderNumber: string): void {
  const targetId = id.toLowerCase()
  const targetWoNum = workOrderNumber.toLowerCase()

  const isMatch = (itemWoId?: string | null, itemWoNum?: string | null) => {
    if (itemWoId && itemWoId.toLowerCase() === targetId) return true
    if (itemWoNum && itemWoNum.toLowerCase() === targetWoNum) return true
    return false
  }

  const storageKeys = [
    'trufocus_crm_post_production_v1',
    'trufocus_crm_payments_v1',
    'trufocus_crm_team_payouts_v1',
    'trufocus_crm_project_expenses_v1',
    'trufocus_crm_invoices_v1',
    'trufocus_crm_customer_portals_v1',
    'trufocus_crm_client_requests_v1',
    'trufocus_crm_pdf_documents_v1',
    'trufocus_crm_data_storage_v1',
  ]

  storageKeys.forEach((key) => {
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const arr: any[] = JSON.parse(raw)
        const filtered = arr.filter(
          (item) => !isMatch(item.work_order_id || item.workOrderId, item.work_order_number || item.workOrderNumber)
        )
        localStorage.setItem(key, JSON.stringify(filtered))
      }
    } catch (e) {
      console.warn(`Error purging key ${key}:`, e)
    }
  })
}

export function softDeleteWorkOrder(
  id: string,
  deletedBy = 'Admin',
  reason = ''
): { success: boolean; message: string } {
  if (!canUserPerformDelete('work_orders')) {
    logAIPermissionAudit({
      user_id: 'usr-security',
      user_name: deletedBy,
      role: 'Restricted',
      module: 'work_orders',
      requested_action: 'delete',
      prompt_text: `Attempted delete Work Order ${id}`,
      allowed: false,
      reason: "Permission Denied: Only Owner and Administrator can delete Work Orders.",
    })
    return {
      success: false,
      message: "Permission Denied: You don't have permission to delete Work Orders. Please contact an Administrator or Owner.",
    }
  }

  const existingList = getLocalWorkOrders()
  const woIndex = existingList.findIndex(
    (w) => w.id === id || w.work_order_number === id
  )

  if (woIndex === -1) {
    return { success: false, message: 'Work Order not found.' }
  }

  const wo = existingList[woIndex]
  const now = new Date().toISOString()

  wo.deleted_at = now
  wo.status = 'deleted'
  ;(wo as any).deleted_by = deletedBy
  ;(wo as any).delete_reason = reason

  // Soft delete dependencies
  if (wo.events) {
    wo.events = wo.events.map((e) => ({ ...e, deleted_at: now }))
  }
  if (wo.deliverables) {
    wo.deliverables = wo.deliverables.map((d) => ({ ...d, deleted_at: now }))
  }

  if (!wo.activity_logs) wo.activity_logs = []
  wo.activity_logs.unshift({
    id: 'act_' + Date.now(),
    action: 'Work Order Soft Deleted',
    user: deletedBy,
    date: now,
    details: `Work Order soft deleted by ${deletedBy}. Reason: ${reason || 'N/A'}. All related records marked deleted.`,
  })

  existingList[woIndex] = wo

  // Clear data from everywhere across all storage keys
  purgeWorkOrderDataFromEverywhere(wo.id, wo.work_order_number)

  try {
    localStorage.setItem(LOCAL_STORAGE_WO_KEY, JSON.stringify(existingList))
    broadcastPaymentSync({ workOrderId: wo.id, action: 'WORK_ORDER_DELETED' })
    window.dispatchEvent(new CustomEvent('workOrdersUpdated'))
    window.dispatchEvent(new CustomEvent('enquiriesUpdated'))
    logLoginAudit(
      'Work Order Deleted',
      deletedBy,
      wo.work_order_number,
      `Soft deleted Work Order ${wo.work_order_number} (${wo.project_name}). Reason: ${reason || 'N/A'}`
    )
  } catch (e) {
    console.error('Error soft deleting work order:', e)
  }

  return { success: true, message: `🗑 Work Order ${wo.work_order_number} has been soft deleted.` }
}

export function restoreWorkOrder(
  id: string,
  restoredBy = 'Admin'
): { success: boolean; message: string } {
  const existingList = getLocalWorkOrders()
  const woIndex = existingList.findIndex(
    (w) => w.id === id || w.work_order_number === id
  )

  if (woIndex === -1) {
    return { success: false, message: 'Work Order not found.' }
  }

  const wo = existingList[woIndex]
  const now = new Date().toISOString()

  wo.deleted_at = null
  wo.status = 'upcoming'
  delete (wo as any).deleted_by
  delete (wo as any).delete_reason

  if (wo.events) {
    wo.events = wo.events.map((e) => ({ ...e, deleted_at: null }))
  }
  if (wo.deliverables) {
    wo.deliverables = wo.deliverables.map((d) => ({ ...d, deleted_at: null }))
  }

  if (!wo.activity_logs) wo.activity_logs = []
  wo.activity_logs.unshift({
    id: 'act_' + Date.now(),
    action: 'Work Order Restored',
    user: restoredBy,
    date: now,
    details: `Work Order restored from Trash by ${restoredBy}`,
  })

  existingList[woIndex] = wo

  try {
    localStorage.setItem(LOCAL_STORAGE_WO_KEY, JSON.stringify(existingList))
    broadcastPaymentSync({ workOrderId: wo.id, action: 'WORK_ORDER_RESTORED' })
    window.dispatchEvent(new CustomEvent('workOrdersUpdated'))
    window.dispatchEvent(new CustomEvent('enquiriesUpdated'))
    logLoginAudit(
      'Work Order Restored',
      restoredBy,
      wo.work_order_number,
      `Restored Work Order ${wo.work_order_number} (${wo.project_name}) from Trash`
    )
  } catch (e) {
    console.error('Error restoring work order:', e)
  }

  return { success: true, message: `↺ Work Order ${wo.work_order_number} has been restored!` }
}

export function hardDeleteWorkOrder(
  id: string,
  deletedBy = 'Admin'
): { success: boolean; message: string } {
  if (!canUserPerformDelete('work_orders')) {
    logAIPermissionAudit({
      user_id: 'usr-security',
      user_name: deletedBy,
      role: 'Restricted',
      module: 'work_orders',
      requested_action: 'delete',
      prompt_text: `Attempted hard delete Work Order ${id}`,
      allowed: false,
      reason: "Permission Denied: Only Owner and Administrator can permanently delete Work Orders.",
    })
    return {
      success: false,
      message: "Permission Denied: You don't have permission to delete Work Orders. Please contact an Administrator or Owner.",
    }
  }

  const existingList = getLocalWorkOrders()
  const target = existingList.find((w) => w.id === id || w.work_order_number === id)

  if (!target) {
    return { success: false, message: 'Work Order not found.' }
  }

  const updatedList = existingList.filter((w) => w.id !== id && w.work_order_number !== id)

  // Clear data from everywhere across all storage keys
  purgeWorkOrderDataFromEverywhere(target.id, target.work_order_number)

  try {
    localStorage.setItem(LOCAL_STORAGE_WO_KEY, JSON.stringify(updatedList))
    broadcastPaymentSync({ workOrderId: id, action: 'WORK_ORDER_PERMANENTLY_DELETED' })
    window.dispatchEvent(new CustomEvent('workOrdersUpdated'))
    window.dispatchEvent(new CustomEvent('enquiriesUpdated'))
    logLoginAudit(
      'Work Order Permanently Deleted',
      deletedBy,
      target.work_order_number,
      `Permanently hard-deleted Work Order ${target.work_order_number} (${target.project_name}) and all child records`
    )
  } catch (e) {
    console.error('Error hard deleting work order:', e)
  }

  return { success: true, message: `❌ Permanently deleted Work Order ${target.work_order_number}.` }
}

export function fetchDeletedWorkOrders(): WorkOrder[] {
  return getLocalWorkOrders().filter((w) => w.deleted_at !== null || w.status === 'deleted')
}

export function wipeAllCRMDataToClean(): void {
  const storageKeys = [
    'trufocus_crm_work_orders_v1',
    'trufocus_crm_work_orders_v2',
    'trufocus_crm_enquiries_v1',
    'trufocus_crm_post_production_v1',
    'trufocus_crm_payments_v1',
    'trufocus_crm_team_payouts_v1',
    'trufocus_crm_project_expenses_v1',
    'trufocus_crm_company_expenses_v1',
    'trufocus_crm_invoices_v1',
    'trufocus_crm_customer_portals_v1',
    'trufocus_crm_client_requests_v1',
    'trufocus_crm_data_storage_v1',
    'trufocus_crm_pdf_documents_v1',
    'trufocus_crm_team_members_v1',
    'trufocus_crm_business_profile_v1',
  ]

  storageKeys.forEach((key) => {
    try {
      localStorage.removeItem(key)
    } catch (e) {
      console.warn(`Error wiping key ${key}:`, e)
    }
  })

  try {
    broadcastPaymentSync({ action: 'SYSTEM_WIPED_CLEAN' })
    window.dispatchEvent(new CustomEvent('workOrdersUpdated'))
    window.dispatchEvent(new CustomEvent('enquiriesUpdated'))
    window.dispatchEvent(new CustomEvent('trufocus_portal_updated'))
  } catch (e) {
    console.error(e)
  }
}
