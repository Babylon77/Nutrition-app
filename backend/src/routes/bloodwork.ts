import express from 'express';
import multer from 'multer';
import path from 'path';
import Joi from 'joi';
import { Bloodwork } from '../models/Bloodwork';
import { pdfService } from '../services/pdfService';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/bloodwork/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Validation schemas
const manualBloodworkSchema = Joi.object({
  testDate: Joi.date().required(),
  labName: Joi.string().max(100).optional(),
  doctorName: Joi.string().max(100).optional(),
  labValues: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      value: Joi.number().required(),
      unit: Joi.string().required(),
      referenceRange: Joi.string().optional(),
      status: Joi.string().valid('normal', 'low', 'high', 'critical').optional()
    })
  ).min(1).required(),
  notes: Joi.string().max(1000).optional()
});

// @desc    Upload bloodwork PDF
// @route   POST /api/bloodwork/upload
// @access  Private
router.post('/upload', protect, upload.single('pdf'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createError('Please upload a PDF file', 400);
  }

  const { testDate, labName, doctorName, notes } = req.body;

  try {
    // Parse PDF
    const parsedResult = await pdfService.parsePDF(req.file.path);

    // Use extracted metadata or fallback to request body/defaults
    let finalTestDate: Date;
    
    if (parsedResult.metadata?.testDate) {
      // Parse the extracted date string properly to avoid timezone issues
      const dateStr = parsedResult.metadata.testDate;
      
      // If it's in YYYY-MM-DD format, parse it as local date
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateStr.split('-').map(Number);
        finalTestDate = new Date(year, month - 1, day); // Month is 0-indexed
      } else {
        // For other formats, try normal parsing
        finalTestDate = new Date(dateStr);
      }
    } else if (testDate) {
      finalTestDate = new Date(testDate);
    } else {
      finalTestDate = new Date();
    }
    
    const finalLabName = parsedResult.metadata?.labName || labName;
    const finalDoctorName = parsedResult.metadata?.doctorName || doctorName;

    // Create bloodwork record
    const bloodwork = await Bloodwork.create({
      userId: req.user.id,
      testDate: finalTestDate,
      labName: finalLabName,
      doctorName: finalDoctorName,
      uploadedFile: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      labValues: parsedResult.labValues,
      parsedText: parsedResult.rawText,
      isManualEntry: false,
      notes
    });

    res.status(201).json({
      success: true,
      data: bloodwork,
      parseConfidence: parsedResult.confidence,
      extractedValues: parsedResult.labValues.length,
      extractionMethod: parsedResult.extractionMethod,
      extractedMetadata: parsedResult.metadata
    });

  } catch (error) {
    // Clean up uploaded file if parsing fails
    await pdfService.deletePDF(req.file.path);
    throw error;
  }
}));

// @desc    Create manual bloodwork entry
// @route   POST /api/bloodwork/manual
// @access  Private
router.post('/manual', protect, asyncHandler(async (req, res) => {
  const { date, labValues } = req.body;
  
  if (!date || !labValues || !Array.isArray(labValues)) {
    throw createError('Date and lab values are required', 400);
  }

  const bloodwork = await Bloodwork.create({
    userId: req.user.id,
    testDate: new Date(date),
    labValues,
    isManualEntry: true
  });

  res.status(201).json({
    success: true,
    data: bloodwork
  });
}));

// @desc    Get user's bloodwork history
// @route   GET /api/bloodwork/history
// @access  Private
router.get('/history', protect, asyncHandler(async (req, res) => {
  const { 
    startDate, 
    endDate,
    page = 1, 
    limit = 10 
  } = req.query;

  // Build query
  const query: any = { userId: req.user.id };

  if (startDate || endDate) {
    query.testDate = {};
    if (startDate) query.testDate.$gte = new Date(startDate as string);
    if (endDate) query.testDate.$lte = new Date(endDate as string);
  }

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const bloodwork = await Bloodwork.find(query)
    .sort({ testDate: -1, createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .select('-parsedText'); // Exclude large text field from list

  const total = await Bloodwork.countDocuments(query);

  res.json({
    success: true,
    count: bloodwork.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: bloodwork
  });
}));

// @desc    Get bloodwork by ID
// @route   GET /api/bloodwork/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const bloodwork = await Bloodwork.findOne({
    _id: req.params.id,
    userId: req.user.id
  });

  if (!bloodwork) {
    throw createError('Bloodwork not found', 404);
  }

  res.json({
    success: true,
    data: bloodwork
  });
}));

// @desc    Update bloodwork
// @route   PUT /api/bloodwork/:id
// @access  Private
router.put('/:id', protect, asyncHandler(async (req, res) => {
  const { error, value } = manualBloodworkSchema.validate(req.body);
  
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  let bloodwork = await Bloodwork.findOne({
    _id: req.params.id,
    userId: req.user.id
  });

  if (!bloodwork) {
    throw createError('Bloodwork not found', 404);
  }

  bloodwork = await Bloodwork.findByIdAndUpdate(
    req.params.id,
    value,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: bloodwork
  });
}));

// @desc    Delete bloodwork
// @route   DELETE /api/bloodwork/:id
// @access  Private
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const bloodwork = await Bloodwork.findOne({
    _id: req.params.id,
    userId: req.user.id
  });

  if (!bloodwork) {
    throw createError('Bloodwork not found', 404);
  }

  // Delete associated PDF file if exists
  if (bloodwork.uploadedFile?.path) {
    await pdfService.deletePDF(bloodwork.uploadedFile.path);
  }

  await Bloodwork.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Bloodwork deleted successfully'
  });
}));

// @desc    Get lab value trends
// @route   GET /api/bloodwork/trends/:labName
// @access  Private
router.get('/trends/:labName', protect, asyncHandler(async (req, res) => {
  const { labName } = req.params;
  const { startDate, endDate } = req.query;

  // Build query
  const query: any = { 
    userId: req.user.id,
    'labValues.name': { $regex: new RegExp(labName, 'i') }
  };

  if (startDate || endDate) {
    query.testDate = {};
    if (startDate) query.testDate.$gte = new Date(startDate as string);
    if (endDate) query.testDate.$lte = new Date(endDate as string);
  }

  const bloodwork = await Bloodwork.find(query)
    .sort({ testDate: 1 })
    .select('testDate labValues');

  // Extract specific lab values
  const trends = bloodwork.map(bw => {
    const labValue = bw.labValues.find(lv => 
      lv.name.toLowerCase().includes(labName.toLowerCase())
    );
    
    return {
      date: bw.testDate,
      value: labValue?.value,
      unit: labValue?.unit,
      status: labValue?.status,
      referenceRange: labValue?.referenceRange
    };
  }).filter(trend => trend.value !== undefined);

  res.json({
    success: true,
    labName,
    count: trends.length,
    data: trends
  });
}));

// @desc    Get latest lab values summary
// @route   GET /api/bloodwork/latest
// @access  Private
router.get('/latest', protect, asyncHandler(async (req, res) => {
  const latestBloodwork = await Bloodwork.findOne({
    userId: req.user.id
  }).sort({ testDate: -1 });

  if (!latestBloodwork) {
    throw createError('No bloodwork found', 404);
  }

  // Group lab values by category for better organization
  const categorizedValues = {
    metabolic: [],
    lipid: [],
    hematology: [],
    thyroid: [],
    vitamins: [],
    other: []
  };

  latestBloodwork.labValues.forEach(lab => {
    const name = lab.name.toLowerCase();
    
    if (name.includes('glucose') || name.includes('a1c') || name.includes('insulin')) {
      categorizedValues.metabolic.push(lab);
    } else if (name.includes('cholesterol') || name.includes('triglyceride') || name.includes('hdl') || name.includes('ldl')) {
      categorizedValues.lipid.push(lab);
    } else if (name.includes('hemoglobin') || name.includes('hematocrit') || name.includes('blood cell') || name.includes('platelet')) {
      categorizedValues.hematology.push(lab);
    } else if (name.includes('tsh') || name.includes('t3') || name.includes('t4')) {
      categorizedValues.thyroid.push(lab);
    } else if (name.includes('vitamin') || name.includes('b12') || name.includes('folate')) {
      categorizedValues.vitamins.push(lab);
    } else {
      categorizedValues.other.push(lab);
    }
  });

  res.json({
    success: true,
    data: {
      testDate: latestBloodwork.testDate,
      labName: latestBloodwork.labName,
      categorizedValues,
      totalValues: latestBloodwork.labValues.length
    }
  });
}));

// @desc    Get user's bloodwork entries
// @route   GET /api/bloodwork
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
  const { 
    startDate, 
    endDate,
    page = 1, 
    limit = 10 
  } = req.query;

  // Build query
  const query: any = { userId: req.user.id };

  if (startDate || endDate) {
    query.testDate = {};
    if (startDate) query.testDate.$gte = new Date(startDate as string);
    if (endDate) query.testDate.$lte = new Date(endDate as string);
  }

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const bloodwork = await Bloodwork.find(query)
    .sort({ testDate: -1, createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .select('-parsedText'); // Exclude large text field from list

  const total = await Bloodwork.countDocuments(query);

  // Transform data to match frontend expectations
  const transformedData = bloodwork.map(entry => ({
    _id: entry._id,
    userId: entry.userId,
    date: entry.testDate, // Map testDate to date for frontend compatibility
    testDate: entry.testDate, // Keep original for backend compatibility
    source: entry.isManualEntry ? 'manual' : 'pdf',
    filename: entry.uploadedFile?.originalName,
    labName: entry.labName,
    doctorName: entry.doctorName,
    labValues: entry.labValues,
    uploadedFile: entry.uploadedFile,
    isManualEntry: entry.isManualEntry,
    notes: entry.notes,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt
  }));

  res.json({
    success: true,
    count: transformedData.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: transformedData
  });
}));

// @desc    Download/view uploaded PDF
// @route   GET /api/bloodwork/:id/pdf
// @access  Private
router.get('/:id/pdf', asyncHandler(async (req, res) => {
  let userId;
  
  // Try to get user from Authorization header first (normal API calls)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (error) {
      // Token invalid, continue to try query parameter
    }
  }
  
  // If no valid auth header, try token from query parameter (for window.open)
  if (!userId && req.query.token) {
    try {
      const decoded = require('jsonwebtoken').verify(req.query.token as string, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (error) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
  }
  
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }

  const bloodwork = await Bloodwork.findOne({
    _id: req.params.id,
    userId: userId
  });

  if (!bloodwork) {
    throw createError('Bloodwork not found', 404);
  }

  if (!bloodwork.uploadedFile?.path) {
    throw createError('No PDF file associated with this bloodwork', 404);
  }

  const filePath = bloodwork.uploadedFile.path;
  
  // Check if file exists
  if (!require('fs').existsSync(filePath)) {
    throw createError('PDF file not found on server', 404);
  }

  // Set appropriate headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${bloodwork.uploadedFile.originalName}"`);
  
  // Send the file
  res.sendFile(require('path').resolve(filePath));
}));

export default router; 