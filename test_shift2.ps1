Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile("c:\Users\yandiuk.o\Desktop\РС Головна сторінка\image_89b7b0.png")
$w = [int]$src.Width
$h = [int]$src.Height
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)

$g.Clear([System.Drawing.Color]::White)

$destRect1 = New-Object System.Drawing.Rectangle(0, 0, $w, 355)
$srcRect1 = New-Object System.Drawing.Rectangle(0, 0, $w, 355)
$g.DrawImage($src, $destRect1, $srcRect1, [System.Drawing.GraphicsUnit]::Pixel)

$shift = 65
$h2 = $h - 355 - $shift
$sy = 355 + $shift
$destRect2 = New-Object System.Drawing.Rectangle(0, 355, $w, $h2)
$srcRect2 = New-Object System.Drawing.Rectangle(0, $sy, $w, $h2)
$g.DrawImage($src, $destRect2, $srcRect2, [System.Drawing.GraphicsUnit]::Pixel)

# Draw buttons
$font = New-Object System.Drawing.Font("Segoe UI", 9.5, [System.Drawing.FontStyle]::Bold)
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(60, 60, 60))
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, 220, 220), 1)

function Draw-Button($x, $y) {
    $rect = New-Object System.Drawing.Rectangle($x, $y, 160, 30)
    $g.FillRectangle($bgBrush, $rect)
    $g.DrawRectangle($pen, $rect)
    $g.DrawString("Продовжити зберігання", $font, $brush, $x + 5, $y + 5)
}

# Find text position. The buttons are on the right side.
# Let's just draw them at X=610, Y=407 and Y=452 (guessed from earlier)
Draw-Button 600 405
Draw-Button 600 455

$bmp.Save("c:\Users\yandiuk.o\Desktop\РС Головна сторінка\image_test2.png")
$g.Dispose()
$bmp.Dispose()
$src.Dispose()
