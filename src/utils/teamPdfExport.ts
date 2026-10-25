import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Team } from '../types';

function formatInr(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return 'Rs. 0';
  return `Rs. ${Math.round(val).toLocaleString('en-IN')}`;
}

/**
 * Generates and downloads a clean, professional PDF card for a single Team.
 */
export function exportTeamCardPdf(team: Team): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const squad = team.squad || [];

  const totalSpent = Math.max(0, team.totalPurse - team.remainingPurse);
  const iconCount = squad.filter((sp) => sp.isIcon || sp.player?.isIcon).length;
  const overseasCount = squad.filter((sp) => sp.player?.isOverseas).length;
  const batters = squad.filter((sp) => sp.player?.role === 'Batter').length;
  const bowlers = squad.filter((sp) => sp.player?.role === 'Bowler').length;
  const allRounders = squad.filter((sp) => sp.player?.role === 'All-Rounder').length;
  const keepers = squad.filter((sp) => sp.player?.role === 'Wicketkeeper').length;

  // 1. Top Brand Banner
  let hexColor = team.primaryColor || '#1e293b';
  if (!hexColor.startsWith('#')) hexColor = '#1e293b';
  doc.setFillColor(hexColor);
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Banner Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('CRICKET AUCTION ARENA 2026', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('OFFICIAL TEAM CARD & SQUAD ROSTER', 14, 18);

  const timestamp = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.setFontSize(8);
  doc.text(`Generated: ${timestamp}`, pageWidth - 14, 18, { align: 'right' });

  // 2. Team Profile Header Box
  let startY = 32;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, startY, pageWidth - 28, 30, 3, 3, 'FD');

  // Team Name & Short Name
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(team.name.toUpperCase(), 20, startY + 10);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`[${team.shortName}]`, 20 + doc.getTextWidth(team.name.toUpperCase()) + 4, startY + 10);

  // Owner & Info details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  const ownerText = `Owner: ${team.ownerName || '—'}`;
  const phoneText = `Phone: ${team.phone || '—'}`;
  const addressText = `Location: ${team.address || '—'}`;

  doc.text(ownerText, 20, startY + 18);
  doc.text(phoneText, 80, startY + 18);
  doc.text(addressText, 140, startY + 18);

  doc.text(`Max Squad Limit: ${team.maxSquadSize || 12}`, 20, startY + 25);
  doc.text(`Overseas Cap: ${team.maxOverseas || 4}`, 80, startY + 25);
  doc.text(`Total Squad Filled: ${squad.length} Players`, 140, startY + 25);

  // 3. Financial & Composition Stats (3 summary cards)
  startY += 36;
  const colW = (pageWidth - 28 - 8) / 3;

  // Card 1: Total Budget
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, startY, colW, 20, 2, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL PURSE', 18, startY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text(formatInr(team.totalPurse), 18, startY + 15);

  // Card 2: Remaining Purse
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(14 + colW + 4, startY, colW, 20, 2, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105);
  doc.text('REMAINING PURSE', 18 + colW + 4, startY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(4, 120, 87);
  doc.text(formatInr(team.remainingPurse), 18 + colW + 4, startY + 15);

  // Card 3: Spent Purse
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(14 + (colW + 4) * 2, startY, colW, 20, 2, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(225, 29, 72);
  doc.text('TOTAL SPENT', 18 + (colW + 4) * 2, startY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(190, 18, 60);
  doc.text(formatInr(totalSpent), 18 + (colW + 4) * 2, startY + 15);

  // 4. Role Pill Breakdown
  startY += 26;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text('SQUAD ROSTER & LINEUP', 14, startY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const compositionStr = `Batters: ${batters}   |   Bowlers: ${bowlers}   |   All-Rounders: ${allRounders}   |   WKs: ${keepers}   |   Overseas: ${overseasCount}   |   Icons: ${iconCount}`;
  doc.text(compositionStr, pageWidth - 14, startY, { align: 'right' });

  // 5. Squad Players Table using AutoTable
  const tableData = squad.map((sp, idx) => {
    const p = sp.player;
    const isIcon = sp.isIcon || p?.isIcon;
    const isOverseas = p?.isOverseas;
    const tag = isIcon ? 'ICON' : isOverseas ? 'OVERSEAS' : 'REGULAR';
    return [
      String(idx + 1),
      p?.sNo !== undefined ? String(p.sNo) : '—',
      p?.name || 'Unknown',
      p?.role || '—',
      p?.category || 'General',
      tag,
      p?.battingStyle || '—',
      p?.bowlingStyle || '—',
      formatInr(p?.basePrice || 100),
      formatInr(sp.price || p?.currentPrice || 100),
    ];
  });

  if (tableData.length === 0) {
    tableData.push(['—', '—', 'No players purchased yet in auction', '—', '—', '—', '—', '—', '—', '—']);
  }

  autoTable(doc, {
    startY: startY + 4,
    margin: { left: 14, right: 14, bottom: 20 },
    head: [[
      '#',
      'S.No',
      'Player Name',
      'Role',
      'Category',
      'Type',
      'Batting',
      'Bowling',
      'Base Price',
      'Sold Price',
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 12 },
      2: { fontStyle: 'bold', cellWidth: 38 },
      3: { halign: 'center', cellWidth: 22 },
      4: { halign: 'center', cellWidth: 18 },
      5: { halign: 'center', cellWidth: 18 },
      6: { halign: 'center', cellWidth: 20 },
      7: { halign: 'center', cellWidth: 20 },
      8: { halign: 'right', cellWidth: 18 },
      9: { halign: 'right', fontStyle: 'bold', cellWidth: 20 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // 6. Page Numbers & Footer
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, doc.internal.pageSize.getHeight() - 12, pageWidth - 14, doc.internal.pageSize.getHeight() - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Official Team Document • Cricket Auction Arena 2026',
      14,
      doc.internal.pageSize.getHeight() - 7
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - 14,
      doc.internal.pageSize.getHeight() - 7,
      { align: 'right' }
    );
  }

  // Save the PDF
  const safeFilename = `${team.name.replace(/[^a-zA-Z0-9]/g, '_')}_Team_Card.pdf`;
  doc.save(safeFilename);
}

/**
 * Generates and downloads a master PDF containing all teams in one multi-page report.
 */
export function exportAllTeamsPdf(teams: Team[]): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  teams.forEach((team, teamIdx) => {
    if (teamIdx > 0) {
      doc.addPage();
    }

    const squad = team.squad || [];
    const totalSpent = Math.max(0, team.totalPurse - team.remainingPurse);
    const iconCount = squad.filter((sp) => sp.isIcon || sp.player?.isIcon).length;
    const overseasCount = squad.filter((sp) => sp.player?.isOverseas).length;

    // Header Band
    let hexColor = team.primaryColor || '#1e293b';
    if (!hexColor.startsWith('#')) hexColor = '#1e293b';
    doc.setFillColor(hexColor);
    doc.rect(0, 0, pageWidth, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(team.name.toUpperCase(), 14, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`[${team.shortName}]  •  Owner: ${team.ownerName || '—'}  •  Squad: ${squad.length}/${team.maxSquadSize || 12}`, 14, 18);

    doc.text(
      `Purse: ${formatInr(team.remainingPurse)} left of ${formatInr(team.totalPurse)}`,
      pageWidth - 14,
      18,
      { align: 'right' }
    );

    // Table
    const tableData = squad.map((sp, idx) => {
      const p = sp.player;
      return [
        String(idx + 1),
        p?.sNo !== undefined ? String(p.sNo) : '—',
        p?.name || 'Unknown',
        p?.role || '—',
        p?.category || 'General',
        sp.isIcon || p?.isIcon ? 'ICON' : p?.isOverseas ? 'OVERSEAS' : 'REGULAR',
        formatInr(p?.basePrice || 100),
        formatInr(sp.price || p?.currentPrice || 100),
      ];
    });

    if (tableData.length === 0) {
      tableData.push(['—', '—', 'No players in squad yet', '—', '—', '—', '—', '—']);
    }

    autoTable(doc, {
      startY: 28,
      margin: { left: 14, right: 14, bottom: 16 },
      head: [['#', 'S.No', 'Player Name', 'Role', 'Category', 'Type', 'Base Price', 'Sold Price']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [15, 23, 42],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'center', cellWidth: 14 },
        2: { fontStyle: 'bold', cellWidth: 46 },
        3: { halign: 'center', cellWidth: 26 },
        4: { halign: 'center', cellWidth: 22 },
        5: { halign: 'center', cellWidth: 22 },
        6: { halign: 'right', cellWidth: 22 },
        7: { halign: 'right', fontStyle: 'bold', cellWidth: 22 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });
  });

  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, doc.internal.pageSize.getHeight() - 10, pageWidth - 14, doc.internal.pageSize.getHeight() - 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Cricket Auction Arena 2026 • Master Teams Roster', 14, doc.internal.pageSize.getHeight() - 6);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 6, { align: 'right' });
  }

  doc.save('All_Teams_Roster_Master.pdf');
}
