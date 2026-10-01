import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zdbhtojtxqxeqttqjomf.supabase.co'
const supabaseAnonKey = 'sb_publishable_ZHXkkugMTXZtuf41eUgzXw_Z4hvi3M8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function inspectAllTables() {
  console.log('=== INSPECTING ALL SUPABASE TABLES ===')
  const tables = ['work_orders', 'enquiries', 'quotations', 'cloud_sync', 'user_accounts', 'team_members', 'finance_ledger', 'post_production_items']

  for (const tbl of tables) {
    try {
      const { data, error } = await supabase.from(tbl).select('*')
      if (error) {
        console.log(`Table '${tbl}': Error (${error.message})`)
      } else {
        console.log(`Table '${tbl}': ${data ? data.length : 0} rows found.`)
        if (data && data.length > 0) {
          data.forEach((r, idx) => {
            console.log(`  Row ${idx+1}: ID = ${r.id}`)
            if (r.data) {
              if (Array.isArray(r.data)) {
                console.log(`    Data is Array of ${r.data.length} items`)
                r.data.forEach((item, j) => {
                  console.log(`      Item ${j+1}: ID=${item.id || item.work_order_number || item.enquiry_number} | Customer=${item.customer_name} | Date=${item.booking_date || item.event_date || item.created_at} | Status=${item.status}`)
                })
              } else {
                console.log(`    Data object: ID=${r.data.id || r.data.work_order_number} | Customer=${r.data.customer_name} | Status=${r.data.status}`)
              }
            }
          })
        }
      }
    } catch (e) {
      console.log(`Table '${tbl}': Exception (${e.message})`)
    }
  }
}

inspectAllTables()
