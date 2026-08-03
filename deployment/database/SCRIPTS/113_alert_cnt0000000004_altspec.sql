-- =============================================================================
-- 113_alert_cnt0000000004_altspec.sql
-- Update ALERTS.ALTSPEC for ALTID = CNT0000000004 (hole / order-writer report)
--
-- Deploy on ICR app DB (ALERTS.ALTSPEC column required — see 101_alerts_altspec.sql).
-- Re-runnable: overwrites ALTSPEC for this ALTID only.
-- Long HTML: TO_CLOB chunks concatenated to avoid ORA-01704.
-- =============================================================================

SET DEFINE OFF;
SET SQLBLANKLINES ON;

UPDATE ALERTS
   SET ALTSPEC =
       TO_CLOB(q'!
<div class="altspec-doc">
  <h2><strong>Hole report — Order writer specification</strong></h2>
  <p>This specification describes how store associates use the hole report to support daily ordering decisions, how the report is structured, and how <strong>Last delivery status</strong> is determined.</p>

  <h3><strong>Table of contents</strong></h3>
  <ol>
    <li><a href="#sec-business" onclick="event.preventDefault();var e=document.getElementById('sec-business');if(e)e.scrollIntoView({behavior:'smooth'});return false;">Business context</a></li>
    <li><a href="#sec-store-process" onclick="event.preventDefault();var e=document.getElementById('sec-store-process');if(e)e.scrollIntoView({behavior:'smooth'});return false;">Store process</a></li>
    <li><a href="#sec-schedule" onclick="event.preventDefault();var e=document.getElementById('sec-schedule');if(e)e.scrollIntoView({behavior:'smooth'});return false;">Report schedule (store groups)</a></li>
    <li><a href="#sec-tabs" onclick="event.preventDefault();var e=document.getElementById('sec-tabs');if(e)e.scrollIntoView({behavior:'smooth'});return false;">Report tabs</a></li>
    <li><a href="#sec-printable" onclick="event.preventDefault();var e=document.getElementById('sec-printable');if(e)e.scrollIntoView({behavior:'smooth'});return false;">Printable worksheet</a></li>
    <li><a href="#sec-fields" onclick="event.preventDefault();var e=document.getElementById('sec-fields');if(e)e.scrollIntoView({behavior:'smooth'});return false;">Field notes (Orderable / Comment)</a></li>
    <li><a href="#sec-waterfall" onclick="event.preventDefault();var e=document.getElementById('sec-waterfall');if(e)e.scrollIntoView({behavior:'smooth'});return false;">Last delivery status — waterfall logic</a></li>
  </ol>

  <hr />

  <h3 id="sec-business"><strong>1. Business context</strong></h3>
  <p>This report helps the <strong>store order writer</strong> in their daily ordering process. Store associates report all holes on their shelves every day. The report turns those reported holes into an actionable worksheet so the order writer can decide what to order using <strong>Last delivery status</strong> and related order / receipt context.</p>

  <h3 id="sec-store-process"><strong>2. Store process</strong></h3>
  <ol>
    <li>Store associates report all shelf holes during the day.</li>
    <li>At the scheduled run time for the store group, reported holes are scanned and this report is shared with the store.</li>
    <li>For Cleveland stores, around <strong>10:30am</strong>, reported holes are scanned and the report is shared with store associates.</li>
    <li>Store associates print the <strong>Printable</strong> version of the report.</li>
    <li>They process their order according to each reported hole, using <strong>Last delivery status</strong> (and the other Printable columns) to guide the decision.</li>
  </ol>

  <h3 id="sec-schedule"><strong>3. Report schedule (store groups)</strong></h3>
  <p>There are <strong>3 groups</strong> of stores:</p>
  <ul>
    <li><strong>08:30am</strong> — Store <strong>#18</strong> only</li>
    <li><strong>10:30am</strong> — Cleveland (CLE) stores <strong>except</strong> store <strong>#6</strong> and <strong>#9</strong></li>
    <li><strong>10:30pm</strong> — Chicago (CHI) stores, plus CLE stores <strong>#6</strong> and <strong>#9</strong></li>
  </ul>
!') || TO_CLOB(q'!
  <h3 id="sec-tabs"><strong>4. Report tabs</strong></h3>
  <p>The report contains <strong>5 tabs</strong>:</p>
  <ul>
    <li><strong>Recap</strong> — Summary of reported holes during the last <strong>12 weeks</strong>, plus the current week by day, for the major vendors.</li>
    <li><strong>Details</strong> — Reported holes for all items listed in the Recap.</li>
    <li><strong>Persistent Holes (3-day)</strong> — Holes reported <strong>3 days consecutively</strong>.</li>
    <li><strong>Persistent Holes (1-day)</strong> — Holes reported on the <strong>day of the report</strong>.</li>
    <li><strong>Printable (1-day)</strong> — Landscape printable version of <strong>Persistent Holes (1-day)</strong>, with the key columns the order writer needs.</li>
  </ul>

  <h3 id="sec-printable"><strong>5. Printable worksheet</strong></h3>
  <p>The <strong>Printable (1-day)</strong> tab is the working sheet used on the floor. Key columns:</p>
  <ul>
    <li>Hole date</li>
    <li>Dept.</li>
    <li>Supplier code</li>
    <li>Last receipt</li>
    <li>Last item receipt order</li>
    <li>Last vendor order</li>
    <li>Last delivery status</li>
    <li>Item code</li>
    <li>Item desc</li>
    <li>UPC</li>
    <li>on Promo</li>
    <li>Orderable</li>
    <li>Nb days</li>
    <li>Comment</li>
  </ul>

  <h3 id="sec-fields"><strong>6. Field notes (Orderable / Comment)</strong></h3>
  <ul>
    <li><strong>Comment</strong> — Contains <em>Check if discontinued</em> when the item orderable assortment has been turned off.</li>
    <li><strong>Orderable</strong> — Set to <strong>No</strong> for items that are not orderable. Otherwise it is <strong>Yes</strong> (but <strong>Yes</strong> is not displayed everywhere in the report).</li>
  </ul>

  <h3 id="sec-waterfall"><strong>7. Last delivery status — waterfall logic</strong></h3>
  <p>Order writers rely on <strong>Last delivery status</strong> to interpret each hole. Status is resolved with the waterfall below.</p>

  <h4><strong>BA Sweetie only</strong></h4>
  <p>Schedule: stores order by <strong>Friday morning</strong> to deliver to the Cleveland store on <strong>Tuesday</strong>; the rest, along with Chicago, get delivery on <strong>Wednesday</strong> (Wednesday as the delivery date for all locations):</p>
  <ul>
    <li class="ql-indent-1"><strong>SBT (CUT)</strong> — if still a hole the next day after delivery (hole on Friday, Saturday, Sunday)</li>
    <li class="ql-indent-1"><strong>SBT (AWAITING DELIVERY)</strong> — if an order is found</li>
    <li class="ql-indent-1"><strong>SBT (NOT ORDERED)</strong> — if the BA Sweetie item was not ordered</li>
  </ul>

  <h4><strong>Others</strong></h4>
  <ul>
    <li><strong>Step 1:</strong> Is the item <strong>CUT</strong>?
      <ul>
        <li class="ql-indent-1">Look up the last PO for the vendor and item order status</li>
      </ul>
    </li>
    <li><strong>Step 2:</strong> Is this item recently <strong>RECEIVED</strong>?
      <ul>
        <li class="ql-indent-1">Item received or partially received</li>
      </ul>
    </li>
    <li><strong>Step 3:</strong> Is this item on-order <strong>AWAITING DELIVERY</strong>?
      <ul>
        <li class="ql-indent-1">Last item PO in valued or awaiting delivery</li>
      </ul>
    </li>
    <li><strong>Else</strong> — <strong>NOT ORDERED</strong></li>
  </ul>
</div>
!')
 WHERE ALTID = 'CNT0000000004';

COMMIT;

-- Optional check:
-- SELECT ALTID, DBMS_LOB.GETLENGTH(ALTSPEC) AS SPEC_LEN FROM ALERTS WHERE ALTID = 'CNT0000000004';
