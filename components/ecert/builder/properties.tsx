import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Trash2,
    Copy,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Bold,
    Italic,
    Underline,
    ArrowUp,
    ArrowDown,
    ArrowUpToLine,
    ArrowDownToLine,
    Crop,
    Star,
    Award,
    Shield,
    Heart,
    Trophy,
    Medal,
    ThumbsUp,
    MapPin,
    CheckCircle,
    Flag,
} from 'lucide-react';
import { CertificateElement } from '@/lib/types';

interface CertificateEditorPropertiesProps {
    selectedElement?: CertificateElement | null;
    updateElement: (id: string, updates: Partial<CertificateElement>) => void;
    deleteElement: (id: string) => void;
    duplicateElement: (id: string) => void;
    bringToFront: (id: string) => void;
    sendToBack: (id: string) => void;
    moveLayerUp: (id: string) => void;
    moveLayerDown: (id: string) => void;
    onCrop?: (imageUrl: string) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
    Star,
    Award,
    Shield,
    Heart,
    Trophy,
    Medal,
    ThumbsUp,
    MapPin,
    CheckCircle,
    Flag,
};

export function CertificateEditorProperties({
    selectedElement,
    updateElement,
    deleteElement,
    duplicateElement,
    bringToFront,
    sendToBack,
    moveLayerUp,
    moveLayerDown,
    onCrop,
}: CertificateEditorPropertiesProps) {
    if (!selectedElement) {
        return (
            <div className="w-80 bg-white border-l p-4 flex items-center justify-center text-gray-500 text-sm hidden lg:flex">
                Pilih elemen untuk edit
            </div>
        );
    }

    return (
        <div className="w-80 bg-white border-l p-4 overflow-y-auto hidden lg:block h-[calc(100vh-64px)]">
            {/* Header and Layer Controls */}
            <div className="flex items-center justify-between mb-6 border-b pb-4">
                <div>
                    <Label className="text-xs font-semibold text-gray-500 uppercase">
                        {selectedElement.type}
                    </Label>
                    <div className="text-xs text-gray-400 font-mono mt-1">
                        {selectedElement.id.slice(0, 8)}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => duplicateElement(selectedElement.id)}
                        title="Duplicate"
                    >
                        <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteElement(selectedElement.id)}
                        title="Delete"
                        className="text-red-500 hover:text-red-600"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Layer Order */}
                <div>
                    <Label className="text-xs mb-2 block text-gray-500 uppercase">Layer</Label>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => bringToFront(selectedElement.id)}
                            title="Bring to Front"
                        >
                            <ArrowUpToLine className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => moveLayerUp(selectedElement.id)}
                            title="Move Up"
                        >
                            <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => moveLayerDown(selectedElement.id)}
                            title="Move Down"
                        >
                            <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => sendToBack(selectedElement.id)}
                            title="Send to Back"
                        >
                            <ArrowDownToLine className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Position & Size */}
                <div>
                    <Label className="text-xs mb-2 block text-gray-500 uppercase">Posisi & Saiz</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label className="text-[10px] text-gray-500">X</Label>
                            <Input
                                type="number"
                                value={Math.round(selectedElement.x)}
                                onChange={(e) =>
                                    updateElement(selectedElement.id, { x: parseInt(e.target.value) })
                                }
                                className="h-8"
                            />
                        </div>
                        <div>
                            <Label className="text-[10px] text-gray-500">Y</Label>
                            <Input
                                type="number"
                                value={Math.round(selectedElement.y)}
                                onChange={(e) =>
                                    updateElement(selectedElement.id, { y: parseInt(e.target.value) })
                                }
                                className="h-8"
                            />
                        </div>
                        <div>
                            <Label className="text-[10px] text-gray-500">Width</Label>
                            <Input
                                type="number"
                                value={Math.round(selectedElement.width)}
                                onChange={(e) =>
                                    updateElement(selectedElement.id, { width: parseInt(e.target.value) })
                                }
                                className="h-8"
                            />
                        </div>
                        <div>
                            <Label className="text-[10px] text-gray-500">Height</Label>
                            <Input
                                type="number"
                                value={Math.round(selectedElement.height)}
                                onChange={(e) =>
                                    updateElement(selectedElement.id, { height: parseInt(e.target.value) })
                                }
                                className="h-8"
                            />
                        </div>
                    </div>
                </div>

                {/* Opacity */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <Label className="text-sm">Opacity</Label>
                        <span className="text-xs text-gray-500">{selectedElement.opacity ?? 100}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={selectedElement.opacity ?? 100}
                        onChange={(e) =>
                            updateElement(selectedElement.id, { opacity: parseInt(e.target.value) })
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                </div>

                <div className="border-t my-4" />

                {/* Shadow Effect */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm">Shadow</Label>
                        <input
                            type="checkbox"
                            checked={selectedElement.shadow?.enabled ?? false}
                            onChange={(e) =>
                                updateElement(selectedElement.id, {
                                    shadow: {
                                        enabled: e.target.checked,
                                        color: selectedElement.shadow?.color || 'rgba(0,0,0,0.3)',
                                        blur: selectedElement.shadow?.blur || 10,
                                        offsetX: selectedElement.shadow?.offsetX || 4,
                                        offsetY: selectedElement.shadow?.offsetY || 4,
                                    },
                                })
                            }
                            className="w-4 h-4 accent-primary"
                        />
                    </div>
                    {selectedElement.shadow?.enabled && (
                        <div className="space-y-2 pl-2 border-l-2 border-gray-200">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <Label className="text-xs">Blur</Label>
                                    <span className="text-xs text-gray-500">{selectedElement.shadow.blur}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="50"
                                    value={selectedElement.shadow.blur}
                                    onChange={(e) =>
                                        updateElement(selectedElement.id, {
                                            shadow: { ...selectedElement.shadow!, blur: parseInt(e.target.value) }
                                        })
                                    }
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-xs">Offset X</Label>
                                    <Input type="number" value={selectedElement.shadow.offsetX} onChange={(e) => updateElement(selectedElement.id, { shadow: { ...selectedElement.shadow!, offsetX: parseInt(e.target.value) } })} className="mt-1" />
                                </div>
                                <div>
                                    <Label className="text-xs">Offset Y</Label>
                                    <Input type="number" value={selectedElement.shadow.offsetY} onChange={(e) => updateElement(selectedElement.id, { shadow: { ...selectedElement.shadow!, offsetY: parseInt(e.target.value) } })} className="mt-1" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t my-4" />

                {/* Type Specific Properties */}
                {selectedElement.type === 'image' && (
                    <div className="space-y-4">
                        <Label className="text-xs font-semibold text-gray-500 uppercase">Image Settings</Label>
                        {onCrop && (selectedElement.src || typeof selectedElement.content === 'string') && (
                            <Button
                                variant="outline"
                                className="w-full gap-2"
                                onClick={() => onCrop(selectedElement.src || (selectedElement.content as string))}
                            >
                                <Crop className="h-4 w-4" />
                                Crop Image
                            </Button>
                        )}

                        {/* Filters */}
                        <div className="space-y-3">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <Label className="text-sm">Brightness</Label>
                                    <span className="text-xs text-gray-500">{selectedElement.brightness ?? 100}%</span>
                                </div>
                                <input type="range" min="0" max="200" value={selectedElement.brightness ?? 100} onChange={(e) => updateElement(selectedElement.id, { brightness: parseInt(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <Label className="text-sm">Contrast</Label>
                                    <span className="text-xs text-gray-500">{selectedElement.contrast ?? 100}%</span>
                                </div>
                                <input type="range" min="0" max="200" value={selectedElement.contrast ?? 100} onChange={(e) => updateElement(selectedElement.id, { contrast: parseInt(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <Label className="text-sm">Grayscale</Label>
                                    <span className="text-xs text-gray-500">{selectedElement.grayscale ?? 0}%</span>
                                </div>
                                <input type="range" min="0" max="100" value={selectedElement.grayscale ?? 0} onChange={(e) => updateElement(selectedElement.id, { grayscale: parseInt(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" />
                            </div>
                        </div>
                    </div>
                )}

                {selectedElement.type === 'icon' && (
                    <div className="space-y-4">
                        <Label className="text-xs font-semibold text-gray-500 uppercase">Icon Properties</Label>
                        <div>
                            <Label className="text-xs mb-2 block">Pilih Icon</Label>
                            <div className="grid grid-cols-5 gap-2 p-2 border rounded-md bg-gray-50/50">
                                {Object.keys(ICON_MAP).map((iconName) => {
                                    const IconComp = ICON_MAP[iconName];
                                    return (
                                        <Button key={iconName} variant={selectedElement.iconName === iconName ? 'default' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => updateElement(selectedElement.id, { iconName })} title={iconName}>
                                            <IconComp className="h-4 w-4" />
                                        </Button>
                                    )
                                })}
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm">Warna Icon</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <input type="color" value={selectedElement.stroke || '#000000'} onChange={(e) => updateElement(selectedElement.id, { stroke: e.target.value })} className="w-8 h-8 rounded cursor-pointer border" />
                                <Input value={selectedElement.stroke || '#000000'} onChange={(e) => updateElement(selectedElement.id, { stroke: e.target.value })} className="h-8 w-24 font-mono text-xs" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1"><Label className="text-sm">Ketebalan</Label><span className="text-xs text-gray-500">{selectedElement.strokeWidth ?? 2}px</span></div>
                            <input type="range" min="1" max="10" step="0.5" value={selectedElement.strokeWidth ?? 2} onChange={(e) => updateElement(selectedElement.id, { strokeWidth: parseFloat(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" />
                        </div>
                    </div>
                )}

                {selectedElement.type === 'qr' && (
                    <div className="space-y-4">
                        <Label className="text-xs font-semibold text-gray-500 uppercase">QR Code Settings</Label>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-sm text-blue-800 font-medium">URL Pengesahan Auto</p>
                            <p className="text-xs text-blue-600 mt-1">QR Code ini akan menjana link pengesahan sijil secara automatik berdasarkan maklumat penerima sijil.</p>
                        </div>
                        <div>
                            <Label className="text-sm">Warna QR</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <input type="color" value={selectedElement.color || '#000000'} onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border" />
                                <Input value={selectedElement.color || '#000000'} onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })} className="h-8 w-24 font-mono text-xs" />
                            </div>
                        </div>
                    </div>
                )}

                {(selectedElement.type === 'text' || selectedElement.type === 'placeholder') && (
                    <div className="space-y-4">
                        {selectedElement.type === 'text' && (
                            <div>
                                <Label className="text-sm">Teks</Label>
                                <Input value={selectedElement.content || ''} onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })} className="mt-1" />
                            </div>
                        )}
                        <div>
                            <Label className="text-sm">Saiz Font</Label>
                            <Input type="number" value={selectedElement.fontSize || 16} onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })} className="mt-1" />
                        </div>
                        <div>
                            <Label className="text-sm">Font</Label>
                            <select
                                value={selectedElement.fontFamily || 'sans-serif'}
                                onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                                className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                                style={{ fontFamily: selectedElement.fontFamily }}
                            >
                                <optgroup label="Sans Serif">
                                    <option value="sans-serif" style={{ fontFamily: 'sans-serif' }}>Sans Serif</option>
                                    <option value="Arial, sans-serif" style={{ fontFamily: 'Arial' }}>Arial</option>
                                    <option value="Helvetica, sans-serif" style={{ fontFamily: 'Helvetica' }}>Helvetica</option>
                                    <option value="Verdana, sans-serif" style={{ fontFamily: 'Verdana' }}>Verdana</option>
                                    <option value="Tahoma, sans-serif" style={{ fontFamily: 'Tahoma' }}>Tahoma</option>
                                    <option value="Trebuchet MS, sans-serif" style={{ fontFamily: 'Trebuchet MS' }}>Trebuchet MS</option>
                                </optgroup>
                                <optgroup label="Serif">
                                    <option value="serif" style={{ fontFamily: 'serif' }}>Serif</option>
                                    <option value="Times New Roman, serif" style={{ fontFamily: 'Times New Roman' }}>Times New Roman</option>
                                    <option value="Georgia, serif" style={{ fontFamily: 'Georgia' }}>Georgia</option>
                                    <option value="Palatino, serif" style={{ fontFamily: 'Palatino' }}>Palatino</option>
                                    <option value="Book Antiqua, serif" style={{ fontFamily: 'Book Antiqua' }}>Book Antiqua</option>
                                    <option value="Garamond, serif" style={{ fontFamily: 'Garamond' }}>Garamond</option>
                                </optgroup>
                                <optgroup label="Display">
                                    <option value="Impact, sans-serif" style={{ fontFamily: 'Impact' }}>Impact</option>
                                    <option value="Comic Sans MS, cursive" style={{ fontFamily: 'Comic Sans MS' }}>Comic Sans MS</option>
                                    <option value="cursive" style={{ fontFamily: 'cursive' }}>Cursive</option>
                                    <option value="fantasy" style={{ fontFamily: 'fantasy' }}>Fantasy</option>
                                </optgroup>
                                <optgroup label="Monospace">
                                    <option value="monospace" style={{ fontFamily: 'monospace' }}>Monospace</option>
                                    <option value="Courier New, monospace" style={{ fontFamily: 'Courier New' }}>Courier New</option>
                                    <option value="Lucida Console, monospace" style={{ fontFamily: 'Lucida Console' }}>Lucida Console</option>
                                </optgroup>
                                <optgroup label="Google Fonts - Sans Serif">
                                    <option value="Roboto, sans-serif" style={{ fontFamily: 'Roboto' }}>Roboto</option>
                                    <option value="Open Sans, sans-serif" style={{ fontFamily: 'Open Sans' }}>Open Sans</option>
                                    <option value="Lato, sans-serif" style={{ fontFamily: 'Lato' }}>Lato</option>
                                    <option value="Montserrat, sans-serif" style={{ fontFamily: 'Montserrat' }}>Montserrat</option>
                                    <option value="Poppins, sans-serif" style={{ fontFamily: 'Poppins' }}>Poppins</option>
                                </optgroup>
                                <optgroup label="Google Fonts - Serif">
                                    <option value="Playfair Display, serif" style={{ fontFamily: 'Playfair Display' }}>Playfair Display</option>
                                    <option value="Merriweather, serif" style={{ fontFamily: 'Merriweather' }}>Merriweather</option>
                                    <option value="Cinzel, serif" style={{ fontFamily: 'Cinzel' }}>Cinzel</option>
                                </optgroup>
                                <optgroup label="Google Fonts - Decorative">
                                    <option value="Dancing Script, cursive" style={{ fontFamily: 'Dancing Script' }}>Dancing Script</option>
                                    <option value="Great Vibes, cursive" style={{ fontFamily: 'Great Vibes' }}>Great Vibes</option>
                                </optgroup>
                            </select>
                        </div>
                        <div>
                            <Label className="text-sm">Warna</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <input type="color" value={selectedElement.color || '#000000'} onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                                <Input value={selectedElement.color || '#000000'} onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })} className="flex-1" />
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm">Penjajaran</Label>
                            <div className="flex gap-1 mt-1">
                                <Button variant={selectedElement.textAlign === 'left' ? 'default' : 'outline'} size="icon" className="h-9 w-9" onClick={() => updateElement(selectedElement.id, { textAlign: 'left' })}>
                                    <AlignLeft className="h-4 w-4" />
                                </Button>
                                <Button variant={selectedElement.textAlign === 'center' ? 'default' : 'outline'} size="icon" className="h-9 w-9" onClick={() => updateElement(selectedElement.id, { textAlign: 'center' })}>
                                    <AlignCenter className="h-4 w-4" />
                                </Button>
                                <Button variant={selectedElement.textAlign === 'right' ? 'default' : 'outline'} size="icon" className="h-9 w-9" onClick={() => updateElement(selectedElement.id, { textAlign: 'right' })}>
                                    <AlignRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm">Gaya</Label>
                            <div className="flex gap-1 mt-1">
                                <Button variant={selectedElement.fontWeight === 'bold' ? 'default' : 'outline'} size="icon" className="h-9 w-9" onClick={() => updateElement(selectedElement.id, { fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' })}>
                                    <Bold className="h-4 w-4" />
                                </Button>
                                <Button variant={selectedElement.fontStyle === 'italic' ? 'default' : 'outline'} size="icon" className="h-9 w-9" onClick={() => updateElement(selectedElement.id, { fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' })}>
                                    <Italic className="h-4 w-4" />
                                </Button>
                                <Button variant={selectedElement.textDecoration === 'underline' ? 'default' : 'outline'} size="icon" className="h-9 w-9" onClick={() => updateElement(selectedElement.id, { textDecoration: selectedElement.textDecoration === 'underline' ? 'none' : 'underline' })}>
                                    <Underline className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1"><Label className="text-sm">Line Height</Label><span className="text-xs text-gray-500">{selectedElement.lineHeight ?? 1.2}</span></div>
                            <input type="range" min="0.8" max="3" step="0.1" value={selectedElement.lineHeight ?? 1.2} onChange={(e) => updateElement(selectedElement.id, { lineHeight: parseFloat(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1"><Label className="text-sm">Letter Spacing</Label><span className="text-xs text-gray-500">{selectedElement.letterSpacing ?? 0}px</span></div>
                            <input type="range" min="-5" max="20" step="0.5" value={selectedElement.letterSpacing ?? 0} onChange={(e) => updateElement(selectedElement.id, { letterSpacing: parseFloat(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" />
                        </div>
                        <div>
                            <Label className="text-sm">Text Outline</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <input type="color" value={selectedElement.textStroke || '#000000'} onChange={(e) => updateElement(selectedElement.id, { textStroke: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
                                <Input type="number" placeholder="Width" value={selectedElement.textStrokeWidth || 0} onChange={(e) => updateElement(selectedElement.id, { textStrokeWidth: parseInt(e.target.value) || 0 })} className="w-20" />
                                <span className="text-xs text-gray-500">px</span>
                            </div>
                        </div>
                    </div>
                )}

                {selectedElement.type === 'shape' && (
                    <div className="space-y-3">
                        <div>
                            <Label className="text-sm">{selectedElement.shapeType === 'line' ? 'Line Color' : 'Fill Color'}</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <input type="color" value={selectedElement.fill || '#e5e7eb'} onChange={(e) => updateElement(selectedElement.id, { fill: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                                <Input value={selectedElement.fill || '#e5e7eb'} onChange={(e) => updateElement(selectedElement.id, { fill: e.target.value })} className="flex-1" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
