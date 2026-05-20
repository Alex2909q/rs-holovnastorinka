Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile("c:\Users\yandiuk.o\Desktop\РС Головна сторінка\image_89b7b0.png")
$bmp = New-Object System.Drawing.Bitmap($src.Width, $src.Height)
$g = [System.Drawing.Graphics]::FromImage($bmp)

# Fill background with white
$g.Clear([System.Drawing.Color]::White)

# 1. Draw top part (0 to 365)
$destRect1 = New-Object System.Drawing.Rectangle(0, 0, $src.Width, 365)
$srcRect1 = New-Object System.Drawing.Rectangle(0, 0, $src.Width, 365)
$g.DrawImage($src, $destRect1, $srcRect1, [System.Drawing.GraphicsUnit]::Pixel)

# 2. Draw bottom part shifted up by 60 pixels (assuming row is 365 to 425)
$shift = 60
$destRect2 = New-Object System.Drawing.Rectangle(0, 365, $src.Width, $src.Height - 365 - $shift)
$srcRect2 = New-Object System.Drawing.Rectangle(0, 365 + $shift, $src.Width, $src.Height - 365 - $shift)
$g.DrawImage($src, $destRect2, $srcRect2, [System.Drawing.GraphicsUnit]::Pixel)

# Save test image
$bmp.Save("c:\Users\yandiuk.o\Desktop\РС Головна сторінка\image_test.png")
$g.Dispose()
$bmp.Dispose()
$src.Dispose()
