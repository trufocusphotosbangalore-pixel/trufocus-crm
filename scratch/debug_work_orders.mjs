import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zdbhtojtxqxeqttqjomf.supabase.co'
const supabaseAnonKey = 'sb_publishable_ZHXkkugMTXZtuf41eUgzXw_Z4hvi3M8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugAllData() {
  console.log('=== STEP 2 TEMPORARY DEBUG OUTPUT ===')

  // 1. Fetch work_orders from Supabase
  const { data: woRows, error: woErr } = await supabase.from('work_orders').select('*')
  console.log(`\nWORK ORDER MANAGEMENT (SUPABASE):`)
  console.log(`Supabase rows returned: ${woRows ? woRows.length : 0}`)
  
  if (woRows) {
    woRows.forEach((r, idx) => {
      console.log(` Row [${idx+1}] ID=${r.id}:`)
      if (r.data) {
        if (Array.isArray(r.data)) {
          console.log(`  Data is Array of ${r.data.length} Work Orders:`)
          r.data.forEach((wo, j) => {
            console.log(`   [${j+1}] WO: ${wo.work_order_number || wo.id} | Customer: ${wo.customer_name} | Date: ${wo.booking_date} | Status: ${wo.status}`)
          })
        } else {
          console.log(`  Data object: WO: ${r.data.work_order_number || r.id} | Customer: ${r.data.customer_name} | Date: ${r.data.booking_date} | Status: ${r.data.status}`)
        }
      } else {
        console.log(`  Direct fields: WO: ${r.work_order_number || r.id} | Customer: ${r.customer_name} | Date: ${r.booking_date} | Status: ${r.status}`)
      }
    })
  }

  // 2. Fetch post_production or enquiries from Supabase
  const { data: enqRows } = await supabase.from('enquiries').select('*')
  console.log(`\nPOST PRODUCTION / ENQUIRIES (SUPABASE):`)
  console.log(`Supabase Enquiries rows returned: ${enqRows ? enqRows.length : 0}`)
  if (enqRows) {
    enqRows.forEach((r) => {
      if (Array.isArray(r.data)) {
        r.data.forEach((e) => {
          console.log(` Enquiry: ${e.enquiry_number || e.id} | Customer: ${e.customer_name} | WO Ref: ${e.work_order_number || 'None'} | Converted: ${e.converted_to_work_order}`)
        })
      }
    })
  }
}

debugAllData()
